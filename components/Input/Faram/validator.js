import { isFalsy, isTruthy } from '../../../utils/common';

const emptyObject = {};
const emptyArray = [];

const isObject = item => (
    typeof item === 'object' && !Array.isArray(item) && item !== null
);

const hasNoKeys = obj => (
    isFalsy(obj) || Object.keys(obj).length === 0
);

const hasNoValues = array => (
    isFalsy(array) || array.length <= 0 || array.every(e => isFalsy(e))
);

export const accumulateValues = (obj, schema, settings = {}) => {
    const {
        noFalsyValues = false,
        falsyValue = undefined,
    } = settings;

    // NOTE: if schema is array, the object is the node element
    const { member, fields } = schema;
    const isSchemaForLeaf = Array.isArray(schema);
    const isSchemaForArray = !!member;
    const isSchemaForObject = !!fields;

    if (isSchemaForLeaf) {
        if (isFalsy(obj) && !noFalsyValues) {
            return falsyValue;
        }
        return obj;
    } else if (isSchemaForArray) {
        const safeObj = obj || emptyArray;
        const values = [];
        safeObj.forEach((element) => {
            const value = accumulateValues(element, member, settings);
            values.push(value);
        });
        if (hasNoValues(values)) {
            return noFalsyValues ? emptyArray : falsyValue;
        }
        return values;
    } else if (isSchemaForObject) {
        const safeObj = obj || emptyObject;
        const values = {};
        Object.keys(fields).forEach((fieldName) => {
            const value = accumulateValues(safeObj[fieldName], fields[fieldName], settings);
            if (value !== undefined) {
                values[fieldName] = value;
            }
        });
        // FIXME: don't copy values if there is nothing to be cleared
        if (hasNoKeys(values)) {
            return noFalsyValues ? emptyObject : falsyValue;
        }
        return values;
    }

    // FIXME: throw error
    console.error('Schema is invalid at:', schema);
    return undefined;
};

export const accumulateErrors = (obj, schema) => {
    // NOTE: if schema is array, the object is the node element
    const { member, fields, validation } = schema;
    const schemaForLeaf = Array.isArray(schema);
    const schemaForArray = !!member;
    const schemaForObject = !!fields;

    if (schemaForLeaf) {
        let error;
        schema.every((rule) => {
            const { ok, message } = rule(obj);
            if (!ok) {
                error = message;
            }
            return ok;
        });
        return error;
    }

    const errors = {};
    if (validation) {
        const validationErrors = validation(obj);
        if (validationErrors.length > 0) {
            errors.$internal = validationErrors;
        }
    }
    if (schemaForArray) {
        const safeObj = obj || emptyArray;
        safeObj.forEach((element, i) => {
            const fieldError = accumulateErrors(element, member);
            if (fieldError) {
                errors[i] = fieldError;
            }
        });
    } else if (schemaForObject) {
        const safeObj = obj || emptyObject;
        Object.keys(fields).forEach((fieldName) => {
            const fieldError = accumulateErrors(safeObj[fieldName], fields[fieldName]);
            if (fieldError) {
                errors[fieldName] = fieldError;
            }
        });
    }
    return hasNoKeys(errors) ? undefined : errors;
};

export const analyzeErrors = (errors) => {
    // handles undefined, null
    if (isFalsy(errors)) {
        return false;
    }
    // handles empty object {}
    const keys = Object.keys(errors);
    if (keys.length === 0) {
        return false;
    }
    return keys.some((key) => {
        const subErrors = errors[key];
        // handles object
        if (isObject(subErrors)) {
            return analyzeErrors(subErrors);
        }
        // handles string or array of strings
        return isTruthy(subErrors);
    });
};

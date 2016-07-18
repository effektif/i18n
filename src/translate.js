import _ from 'lodash';
import marked from 'marked';
import React from 'react';

var defaultOptions = {
    markdown: false
};

export default (singleton) => function translate(text, plural, options) {

    // singleton.messages contains the translation messages for the currently active languae
    // format: singular key -> [ plural key, singular translations, plural translation ]


    if(!options && _.isObject(plural)) {
        options = plural;
        plural = undefined;
    }
    options = _.extend({}, defaultOptions, options);

    const [ pluralKey, translatedSingular, translatedPlural ] = singleton.messages[text] || [null, null, null];

    // find the raw translation message
    let translation;
    if(plural && needsPlural(options)) {
        translation = translatedPlural && _.isString(translatedPlural) ? translatedPlural : plural;
    } else {
        translation = translatedSingular && _.isString(translatedSingular) ? translatedSingular : text;
    }

    // apply markdown processing if necessary
    if(options.markdown) {
        translation = applyMarkdown(translation);
    }

    // insert regular interpolations
    translation = insertInterpolations(translation, options);

    // insert React component interpolations
    let result = insertReactComponentInterpolations(translation, options);

    return result.length === 1 ? result[0] : result;
}

function needsPlural(options) {
    return _.isNumber(options.count) && options.count > 1;
}

function applyMarkdown(translation) {
    // Escape underscores.
    // (Since we use underscores to denote interpolations, we have to
    // exclude them from the markdown notation. Use asterisk (*) instead.)
    translation = translation.replace(/_/g, "\\_");

    translation = marked(translation);

    // remove single, outer wrapping <p>-tag
    if(translation.lastIndexOf("<p>") === 0 && translation.indexOf("</p>") === translation.length - 5) {
        // last occurrence of <p> is at the start, first occurence of </p> is a the very end
        translation = translation.substring(3, translation.length - 5);
    }

    return translation.replace(/\\_/g, "_");
}

function htmlStringToReactComponent(html) {
    return <span dangerouslySetInnerHTML={{ __html: html }} />
}

function insertInterpolations(translation, options) {
    let regularInterpolations = _.pick(
        options,
        (val, key, obj) => !_.has(defaultOptions, key) && !React.isValidElement(val)
    );
    _.each(regularInterpolations, (val, key) => {
        translation = translation.replace(
            new RegExp("__" + key + "__", "g"),
            options.markdown ? _.escape(val) : val   // only escape options when using markdown
        );
    });
    return translation;
}

function insertReactComponentInterpolations(translation, options) {
    let result = [];
    let placeholderRegex = /__(\w+)__/g;
    let match, substr;
    let start = 0;

    while((match = placeholderRegex.exec(translation)) !== null) {
        let key = match[1];
        let component = options[key];

        if(match.index > 0) {
            substr = translation.substring(start, match.index);
            result.push(options.markdown ? htmlStringToReactComponent(substr) : substr);
        }

        if(React.isValidElement(component)) {
            result.push(
                _.contains(result, component) ?
                    React.cloneElement(component) :
                    component
            );
        } else {
            // interpolation value is not a React component

            if(_.has(options, key)) {
                result.push(component);
            } else {
                // no interpolation specified, leave the placeholder unchanged
                result.push(match[0]);
            }
        }

        start = placeholderRegex.lastIndex;
    }

    if(start < translation.length) {
        substr = translation.substring(start);
        result.push(options.markdown ? htmlStringToReactComponent(substr) : substr);
    }

    return result;
}

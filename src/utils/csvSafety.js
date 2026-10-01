/**
 * Shared editor/visitor CSV policy. Prefix an apostrophe when the first
 * non-whitespace/control character is =, +, -, or @. Strict signed decimal
 * numbers (optional exponent) remain numeric. Quotes alone are not protection.
 * Preserve original whitespace/content, then apply RFC-style CSV quoting.
 * @param {*} value Plain-text field value.
 */
export function csvEscape( value ) {
	let text = String( value ?? '' );
	const candidate = text.replace(
		/^[\s\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f]+/,
		''
	);
	const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(
		candidate.trim()
	);
	const dangerous = /^[=+\-@＝＋－＠]/.test( candidate ) && ! numeric;
	if ( dangerous ) {
		text = "'" + text;
	}
	return dangerous || /[,"\r\n\t]/.test( text )
		? '"' + text.replace( /"/g, '""' ) + '"'
		: text;
}

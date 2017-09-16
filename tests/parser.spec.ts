import { test } from 'ava';
import { ParsedString, parseStringTemplate, parseStringTemplateGenerator } from '../src/parser';

const parseAngularStringTemplate = parseStringTemplateGenerator({
	VARIABLE_START: /^({{\s*)/,
	VARIABLE_END: /^\s*}}/
});

const parseI18NPluralizationTemplate = parseStringTemplateGenerator({
	VARIABLE_START: /^{\s*/,
	VARIABLE_END: /^\s*}/,
	PIPE_START: /^\s*,\s*/,
	PIPE_PARAMETER_START: /^\s*,\s*/,
	QUOTED_STRING_IN_PARAMETER_TEST: (remainingString => remainingString.startsWith('{')),
	QUOTED_STRING_IN_PARAMETER_GET_AND_ADVANCE: ((remainingString: string, advance: (length: number) => void) => {
		let currentPosition = 1;
		let depth = 1;
		while (depth > 0 && currentPosition < remainingString.length) {
			if (remainingString[currentPosition] === '\\') {
				currentPosition += 2;
				continue;
			}
			if (remainingString[currentPosition] === '{') {
				depth++;
			}
			if (remainingString[currentPosition] === '}') {
				depth--;
			}
			currentPosition++;
		}
		const result = remainingString.substr(0, currentPosition);
		advance(currentPosition);
		return result;
	})
});

function testStringParsing(testName: string, testString: string, expected: ParsedString) {
	test(testName, t => {
		const testResult = parseStringTemplate(testString);
		t.deepEqual(testResult, expected);
	});
}

function testAngularStringParsing(testName: string, testString: string, expected: ParsedString) {
	test(testName, t => {
		const testResult = parseAngularStringTemplate(testString);
		t.deepEqual(testResult, expected);
	});
}

function testI18NStringParsing(testName: string, testString: string, expected: ParsedString) {
	test(testName, t => {
		const testResult = parseI18NPluralizationTemplate(testString);
		t.deepEqual(testResult, expected);
	});
}

testStringParsing('empty string', '',
	{literals: [''], variables: []});
testStringParsing('basic string', 'basic string',
	{literals: ['basic string'], variables: []});
testStringParsing('string with variable', 'string with variable ${var}',
	{literals: ['string with variable ', ''], variables: [{name: 'var', pipes: []}]});
testStringParsing('string with variable that includes spaces', 'string with variable ${ var }',
	{literals: ['string with variable ', ''], variables: [{name: 'var', pipes: []}]});
testStringParsing('string without variable, but with escaped ${}', 'string without variable \\${var}',
	{literals: ['string without variable ${var}'], variables: []});
testStringParsing('string with two variables', 'xxx ${var} yyy ${var2} zzz',
	{literals: ['xxx ', ' yyy ', ' zzz'], variables: [
		{name: 'var', pipes: []},
		{name: 'var2', pipes: []}]});
testStringParsing('string with variable & pipe', 'xxx ${var|pipe}',
	{literals: ['xxx ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: []}]}]});
testStringParsing('string with variable, pipe & pipe parameter', 'xxx ${var|pipe:param}',
	{literals: ['xxx ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['param']}]}]});
testStringParsing('string with variable, pipe & multiple pipe parameters', 'xxx ${var|pipe:param1:param2}',
{literals: ['xxx ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['param1', 'param2']}]}]});
testStringParsing('string with variable & multiple pipes', 'xxx ${var|pipe1|pipe2}',
	{literals: ['xxx ', ''], variables: [
		{name: 'var', pipes: [
			{name: 'pipe1', parameters: []},
			{name: 'pipe2', parameters: []}]}]});
testStringParsing('string with empty variable', 'xxx ${}',
	{literals: ['xxx ', ''], variables: [{name: '', pipes: []}]});
testStringParsing('string with quoted variable name (})', 'x ${"var}name"}',
	{literals: ['x ', ''], variables: [{name: 'var}name', pipes: []}]});
testStringParsing('string with quoted variable name (:)', 'x ${"var:name"}',
	{literals: ['x ', ''], variables: [{name: 'var:name', pipes: []}]});
testStringParsing('string with quoted variable name (|)', 'x ${"var|name"}',
	{literals: ['x ', ''], variables: [{name: 'var|name', pipes: []}]});
testStringParsing('string with variable & quoted pipe name (:)', 'x ${var|"pipe:name"}',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'pipe:name', parameters: []}]}]});
testStringParsing('string with variable & quoted pipe name (|)', 'x ${var|"pipe|name"}',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'pipe|name', parameters: []}]}]});
testStringParsing('string with variable, pipe & quoted pipe parameter (:)', 'x ${var|pipe:"param:param"}',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['param:param']}]}]});
testStringParsing('string with variable, pipe & quoted pipe parameter (|)', 'x ${var|pipe:"param|param"}',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['param|param']}]}]});
testStringParsing('string with variable, pipe & escaped (:) in pipe parameter', 'x ${var|pipe:parameter\\:1',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['parameter:1']}]}]});
testStringParsing('string with variable, pipe & escaped (|) in pipe parameter', 'x ${var|pipe:parameter\\|1',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['parameter|1']}]}]});
testStringParsing('string with variable, pipe & escaped (}) in pipe parameter', 'x ${var|pipe:{parameter\\}}',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['{parameter}']}]}]});
testStringParsing('string with variable, pipe & "{}" as pipe parameter', 'x ${var|pipe:"{}"}',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['{}']}]}]});
testStringParsing('string with variable, pipe & escaped \' and " in pipe parameter', 'x ${var|date:m\\\'s\\"}',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'date', parameters: ['m\'s"']}]}]});
testStringParsing('variable with nested quotes', `\${"''"}`,
	{literals: ['', ''], variables: [{name: `''`, pipes: []}]});
testStringParsing('unterminated variable', '${var',
	{literals: ['', ''], variables: [{name: 'var', pipes: []}]});
testStringParsing('unterminated variable with pipe', '${var|pipe',
	{literals: ['', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: []}]}]});
testStringParsing('unterminated variable with pipe & pipe parameter', '${var|pipe:param',
	{literals: ['', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['param']}]}]});
testStringParsing('unterminated variable with string name', '${"var',
	{literals: ['', ''], variables: [{name: 'var', pipes: []}]});
testStringParsing('unterminated variable with string name (|)', '${"var|name',
	{literals: ['', ''], variables: [{name: 'var|name', pipes: []}]});
testStringParsing('unterminated variable with string pipe', '${var|"pipe',
	{literals: ['', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: []}]}]});
testStringParsing('unterminated variable with string pipe (:)', '${var|"pipe:name',
	{literals: ['', ''], variables: [{name: 'var', pipes: [{name: 'pipe:name', parameters: []}]}]});
testStringParsing('unterminated variable with string pipe (|)', '${var|"pipe|name',
	{literals: ['', ''], variables: [{name: 'var', pipes: [{name: 'pipe|name', parameters: []}]}]});
testStringParsing('unterminated variable with string pipe (})', '${var|"pipe}name',
	{literals: ['', ''], variables: [{name: 'var', pipes: [{name: 'pipe}name', parameters: []}]}]});
testStringParsing('unterminated variable with pipe & string pipe parameter', '${var|pipe:"param',
	{literals: ['', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['param']}]}]});
testStringParsing('unterminated variable with pipe & string pipe parameter (:)', '${var|pipe:"param:name',
	{literals: ['', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['param:name']}]}]});
testStringParsing('unterminated variable with pipe & string pipe parameter (|)', '${var|pipe:"param|name',
	{literals: ['', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['param|name']}]}]});
testStringParsing('unterminated variable with pipe & string pipe parameter (})', '${var|pipe:"param}name',
	{literals: ['', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['param}name']}]}]});
testStringParsing('string with variable, pipe & pipe parameter with mixed quote (beginning)', 'x ${var|pipe:"param" x}',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['param x']}]}]});
testStringParsing('string with variable, pipe & pipe parameter with mixed quote (middle)', 'x ${var|pipe:x "param" x}',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['x param x']}]}]});
testStringParsing('string with variable, pipe & pipe parameter with mixed quote (end)', 'x ${var|pipe:x "param"}',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['x param']}]}]});
testStringParsing('string with variable, pipe & pipe parameters (one of which is empty)', 'x ${var|pipe:empty_param_next:}',
	{literals: ['x ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['empty_param_next', '']}]}]});
testStringParsing('unterminated ESCAPE in variable', '${var\\',
	{literals: ['', ''], variables: [{name: 'var', pipes: []}]});
testStringParsing('unterminated ESCAPE in pipe', '${var|pipe\\',
	{literals: ['', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: []}]}]});
testStringParsing('unterminated ESCAPE in pipe parameter', '${var|pipe:param\\',
	{literals: ['', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['param']}]}]});
testStringParsing('empty string in variable', '${""}',
	{literals: ['', ''], variables: [{name: '', pipes: []}]});
testStringParsing('string variable ending in an escaped backslash', '${"\\\\"}',
	{literals: ['', ''], variables: [{name: '\\', pipes: []}]});
testStringParsing('complex example',
	'${ var1 | pipe1 : param1 : param2 | pipe2: paramA : paramB } bla ${ va"r"\\|2 | p"i|p"e\\:test : "p"ara"m"\\:X }',
	{literals: ['', ' bla ', ''], variables: [
		{name: 'var1', pipes: [
			{name: 'pipe1', parameters: ['param1', 'param2']},
			{name: 'pipe2', parameters: ['paramA', 'paramB']}]},
		{name: 'var|2', pipes: [
			{name: 'pi|pe:test', parameters: ['param:X']}]}]});

testAngularStringParsing('angular string without variables', 'string',
	{literals: ['string'], variables: []});
testAngularStringParsing('angular string without variables, but with default variable start/end', 'string ${var}',
	{literals: ['string ${var}'], variables: []});
testAngularStringParsing('angular string without variables (escaped)', 'string \\{{not-a-var}}',
	{literals: ['string {{not-a-var}}'], variables: []});
testAngularStringParsing('angular string with variable', 'string {{var}}',
	{literals: ['string ', ''], variables: [{name: 'var', pipes: []}]});
testAngularStringParsing('angular string with variable & pipe', 'string {{var|pipe}}',
	{literals: ['string ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: []}]}]});
testAngularStringParsing('angular string with variable, pipe & pipe parameter', 'string {{var|pipe:param}}',
	{literals: ['string ', ''], variables: [{name: 'var', pipes: [{name: 'pipe', parameters: ['param']}]}]});
testAngularStringParsing('angular complex example',
	'{{ var1 | pipe1 : param1 : param2 | pipe2: paramA : paramB }} bla {{ va"r"\\|2 | p"i|p"e\\:test : "p"ara"m"\\:X }}',
	{literals: ['', ' bla ', ''], variables: [
		{name: 'var1', pipes: [
			{name: 'pipe1', parameters: ['param1', 'param2']},
			{name: 'pipe2', parameters: ['paramA', 'paramB']}]},
		{name: 'var|2', pipes: [
			{name: 'pi|pe:test', parameters: ['param:X']}]}]});

testI18NStringParsing('I18N: pluralization',
	'this is {numPeople, plural, =0 {no one} =1 {someone} other {everyone}}',
	{literals: ['this is ', ''], variables: [
		{name: 'numPeople', pipes: [
			{name: 'plural', parameters: [
				'=0 {no one} =1 {someone} other {everyone}'
			]}
		]}
	]});
testI18NStringParsing('I18N: select',
	'this is a {gender, select, m {man} f {woman}}',
	{literals: ['this is a ', ''], variables: [
		{name: 'gender', pipes: [
			{name: 'select', parameters: [
				'm {man} f {woman}'
			]}
		]}
	]});
testI18NStringParsing('I18N: pluralization + select',
	'{count, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {count {gender, select, m {men} f {women}}}}',
	{literals: ['', ''], variables: [
		{name: 'count', pipes: [
			{name: 'plural', parameters: [
				'=0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {count {gender, select, m {men} f {women}}}'
			]}
		]}
	]});

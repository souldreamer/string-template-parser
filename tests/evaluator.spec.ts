import { test } from 'ava';
import { PipeFunction, evaluateStringTemplate, evaluateParsedString } from '../src/evaluator';

const variables: {[variableName: string]: any} = {
	a: 'value-a',
	b: 'value-b',
	c: 'value-c',
	d: {
		e: 'bla'
	}
};
const pipes: {[pipeName: string]: PipeFunction} = {
	'!': (variableValue) => `${variableValue}-!`,
	'postfix': (variableValue, parameters) => `${variableValue}-${parameters.join('-')}`,
	'prefix': (variableValue, parameters) => `${parameters.join('-')}-${variableValue}`,
	'upper': (variableValue) => variableValue.toUpperCase()
};

function testStringEvaluation(testName: string, testString: string, expected: string) {
	test(testName, t => {
		const testResult = evaluateStringTemplate(testString, variables, pipes);
		t.is(testResult, expected);
	});
}

testStringEvaluation('evaluate empty string', '', '');
testStringEvaluation('evaluate simple string', 'string', 'string');
testStringEvaluation('evaluate string with empty variable', 'string ${}', 'string ');
testStringEvaluation('evaluate string with variable', 'x ${a}', 'x value-a');
testStringEvaluation('evaluate string with variable & pipe', 'x ${a|upper}', 'x VALUE-A');
testStringEvaluation('evaluate string with variable, pipe & pipe parameter', 'x ${a|!}', 'x value-a-!');
testStringEvaluation('evaluate string with variable, pipe & multiple pipe parameters', 'x ${a|postfix:1:2}', 'x value-a-1-2');
testStringEvaluation('evaluate string with variable, multiple pipes & pipe parameter', 'x ${a|!|prefix:@}', 'x @-value-a-!');
testStringEvaluation('evaluate string with variable, multiple pipes & pipe parameters', 'x ${a|!|prefix:@:#}', 'x @-#-value-a-!');
testStringEvaluation('evaluate string with variable, multiple pipes & pipe parameters', 'x ${a|!|prefix:@:#|postfix:1:2}', 'x @-#-value-a-!-1-2');
testStringEvaluation('evaluate string with multiple variables', 'x ${a} ${b}', 'x value-a value-b');
testStringEvaluation('evaluate complex example',
	'x ${a|!|prefix:@:#|postfix:1:2} y ${b|upper|postfix:u|prefix:t} z',
	'x @-#-value-a-!-1-2 y t-VALUE-B-u z');
testStringEvaluation('evaluate string with variable & inexistent pipe', '${a|foo}', 'value-a');
testStringEvaluation('evaluate string with sub-variable', '${d.e}', 'bla');

test('evaluateParsedString: no literals in literal array', t => {
	const testResult = evaluateParsedString({literals: [], variables: []}, {}, {});
	t.is(testResult, '');
});

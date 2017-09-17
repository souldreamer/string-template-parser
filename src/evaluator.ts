import { ParsedString, Variable, parseStringTemplate } from './parser';

export interface PipeFunction {
	(variableValue: any, parameters: string[]): string;
}

function DEFAULT_GET_VALUE(variables: {[variableName: string]: any}) {
	return (variableName: string) =>
		variables.hasOwnProperty(variableName)
			? variables[variableName]
			: variableName.split('.').reduce((value, current) => value.hasOwnProperty(current) ? value[current] : '', variables);
}

function getParsedVariable(
	variable: Variable,
	variables: {[variableName: string]: string},
    pipes: {[pipeName: string]: PipeFunction},
	getValue: (variableName: string) => any = DEFAULT_GET_VALUE(variables)
): string {
	return variable.pipes.reduce((variableValue, pipe) => {
			return pipes.hasOwnProperty(pipe.name) ?
				pipes[pipe.name](variableValue, pipe.parameters) :
				variableValue;
		}, getValue(variable.name) || '');
}

export function evaluateParsedString(
	parsedString: ParsedString,
    variables: {[variableName: string]: any},
    pipes: {[pipeName: string]: PipeFunction},
	getValue: (variableName: string) => any = DEFAULT_GET_VALUE(variables)
): string {
	if (parsedString.literals.length === 0) return '';
	return parsedString.literals.slice(1).reduce((result, literal, index) =>
		`${result}${getParsedVariable(parsedString.variables[index], variables, pipes, getValue)}${literal}`,
		parsedString.literals[0]);
}

export function evaluateStringTemplate(
	input: string,
    variables: {[variableName: string]: string},
    pipes: {[pipeName: string]: PipeFunction}
): string {
	return evaluateParsedString(parseStringTemplate(input), variables, pipes);
}

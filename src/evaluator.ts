import { ParsedString, Variable, parseStringTemplate } from './parser';

export interface PipeFunction {
	(variableValue: string, parameters: string[]): string;
}

function getParsedVariable(
	variable: Variable,
	variables: {[variableName: string]: string},
    pipes: {[pipeName: string]: PipeFunction}
): string {
	return variable.pipes.reduce((variableValue, pipe) => {
			return pipes.hasOwnProperty(pipe.name) ?
				pipes[pipe.name](variableValue, pipe.parameters) :
				variableValue;
		}, variables.hasOwnProperty(variable.name) ? variables[variable.name] : '');
}

export function evaluateParsedString(
	parsedString: ParsedString,
    variables: {[variableName: string]: string},
    pipes: {[pipeName: string]: PipeFunction}
): string {
	if (parsedString.literals.length === 0) return '';
	return parsedString.literals.slice(1).reduce((result, literal, index) =>
		`${result}${getParsedVariable(parsedString.variables[index], variables, pipes)}${literal}`,
		parsedString.literals[0]);
}

export function evaluateStringTemplate(
	input: string,
    variables: {[variableName: string]: string},
    pipes: {[pipeName: string]: PipeFunction}
): string {
	return evaluateParsedString(parseStringTemplate(input), variables, pipes);
}

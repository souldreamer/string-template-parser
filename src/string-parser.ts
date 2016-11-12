export interface Pipe {
	name: string;
	parameters: string[];
}

export interface Variable {
	name: string;
	pipes: Pipe[];
}

export interface ParsedString {
	literals: string[];
	variables: Variable[];
}

const enum ParseState {
	Literal,
	Variable,
	Pipe,
	PipeParameter
}

export function parseStringTemplateGenerator({
	ESCAPE = /^\\/,
	VARIABLE_START = /^\$\{\s*/,
	VARIABLE_END = /^\s*}/,
	PIPE_START = /^\s*\|\s*/,
	PIPE_PARAMETER_START = /^\s*:\s*/,
	QUOTED_STRING = /^('((?:[^'\\]|\\.)*)'|'((?:[^'\\]|\\.)*)$|"((?:[^"\\]|\\.)*)"|"((?:[^"\\]|\\.)*)$)/
} = {}) {
	return function parseStringTemplate(input: string): ParsedString {
		let remainingString = input;
		let parsedString: ParsedString = {literals: [], variables: []};
		let parseState = <ParseState>ParseState.Literal;
		let currentLiteral = '';
		let currentVariable: Variable = {name: '', pipes: []};
		let currentPipe: Pipe = {name: '', parameters: []};
		let currentPipeParameter: string = '';
		let existsCurrentVariable = false;
		let existsCurrentPipe = false;
		let existsCurrentPipeParameter = false;

		while (remainingString.length > 0) {
			switch (parseState) {
			case ParseState.Literal:
				if (ESCAPE.test(remainingString)) {
					currentLiteral += getEscapedCharacter();
					continue;
				}
				if (VARIABLE_START.test(remainingString)) {
					parseState = ParseState.Variable;
					newCurrentVariable();
					parsedString.literals.push(currentLiteral);
					currentLiteral = '';
					skipMatch(VARIABLE_START);
					continue;
				}
				currentLiteral += remainingString[0];
				advance();
				break;
			case ParseState.Variable:
				if (ESCAPE.test(remainingString)) {
					currentVariable.name += getEscapedCharacter();
					continue;
				}
				if (testVariableEnd() || testPipeStart()) continue;
				if (QUOTED_STRING.test(remainingString)) {
					currentVariable.name += getQuotedString();
					continue;
				}
				currentVariable.name += remainingString[0];
				advance();
				break;
			case ParseState.Pipe:
				if (ESCAPE.test(remainingString)) {
					currentPipe.name += getEscapedCharacter();
					continue;
				}
				if (testVariableEnd() || testPipeStart() || testPipeParameterStart()) continue;
				if (QUOTED_STRING.test(remainingString)) {
					currentPipe.name += getQuotedString();
					continue;
				}
				currentPipe.name += remainingString[0];
				advance();
				break;
			case ParseState.PipeParameter:
				if (ESCAPE.test(remainingString)) {
					currentPipeParameter += getEscapedCharacter();
					continue;
				}
				if (testVariableEnd() || testPipeStart() || testPipeParameterStart()) continue;
				if (QUOTED_STRING.test(remainingString)) {
					currentPipeParameter += getQuotedString();
					continue;
				}
				currentPipeParameter += remainingString[0];
				advance();
				break;
			}
		}
		if (existsCurrentPipeParameter) currentPipe.parameters.push(currentPipeParameter);
		if (existsCurrentPipe) currentVariable.pipes.push(currentPipe);
		if (existsCurrentVariable) parsedString.variables.push(currentVariable);
		parsedString.literals.push(currentLiteral);

		return parsedString;

		function advance(length: number = 1) {
			remainingString = remainingString.substr(length);
		}
		function skipMatch(regex: RegExp = /^/) {
			advance((<RegExpMatchArray>remainingString.match(regex))[0].length);
		}
		
		function getEscapedCharacter(): string {
			let escapedCharacter: string;
			
			skipMatch(ESCAPE);
			escapedCharacter = remainingString.length > 0 ? remainingString[0] : '';
			advance();
			
			return escapedCharacter;
		}
		function getQuotedString(): string {
			const quotedStringMatch = <RegExpMatchArray>remainingString.match(QUOTED_STRING);
			advance(quotedStringMatch[0].length);
			return quotedStringMatch.slice(2).join('').replace('\\\\', '\\');
		}
		
		function newCurrentVariable({isNull = false} = {}) {
			currentVariable = {name: '', pipes: []};
			existsCurrentVariable = !isNull;
		}
		function deleteCurrentVariable() {
			parsedString.variables.push(currentVariable);
			newCurrentVariable({isNull: true});
		}
		function newCurrentPipe({isNull = false} = {}) {
			currentPipe = {name: '', parameters: []};
			existsCurrentPipe = !isNull;
		}
		function deleteCurrentPipe() {
			currentVariable.pipes.push(currentPipe);
			newCurrentPipe({isNull: true});
		}
		function newCurrentPipeParameter({isNull = false} = {}) {
			currentPipeParameter = '';
			existsCurrentPipeParameter = !isNull;
		}
		function deleteCurrentPipeParameter() {
			currentPipe.parameters.push(currentPipeParameter);
			newCurrentPipeParameter({isNull: true});
		}
		
		function testVariableEnd(): boolean {
			if (!VARIABLE_END.test(remainingString)) return false;
			skipMatch(VARIABLE_END);
			if (parseState >= ParseState.PipeParameter) deleteCurrentPipeParameter();
			if (parseState >= ParseState.Pipe) deleteCurrentPipe();
			if (parseState >= ParseState.Variable) deleteCurrentVariable();
			parseState = ParseState.Literal;
			return true;
		}
		function testPipeStart(): boolean {
			if (!PIPE_START.test(remainingString)) return false;
			skipMatch(PIPE_START);
			if (parseState >= ParseState.PipeParameter) deleteCurrentPipeParameter();
			if (parseState >= ParseState.Pipe) deleteCurrentPipe();
			if (parseState >= ParseState.Variable) newCurrentPipe();
			parseState = ParseState.Pipe;
			return true;
		}
		function testPipeParameterStart(): boolean {
			if (!PIPE_PARAMETER_START.test(remainingString)) return false;
			skipMatch(PIPE_PARAMETER_START);
			if (parseState >= ParseState.PipeParameter) deleteCurrentPipeParameter();
			if (parseState >= ParseState.Pipe) newCurrentPipeParameter();
			parseState = ParseState.PipeParameter;
			return true;
		}
	};
}

export const parseStringTemplate = parseStringTemplateGenerator();

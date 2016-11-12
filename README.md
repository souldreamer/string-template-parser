# string-template-parser

String template parsing utilities.

`parseStringTemplate` uses the default configuration (i.e. variable
start is marked by `${` and variable end by `}`, the escape character
is ` \ `, a pipe is started with `|` and a pipe parameter starts after
a `:`, e.g. `'string ${var | pipe : parameter}`).

`parseStringTemplateGenerator` returns a string parsing function
that uses the supplied expressions from the configuration parameter
to parse the string.

## Usage

#### `parseStringTemplate`

```typescript
import { parseStringTemplate } from 'string-template-parser';

parseStringTemplate('a ${v1|p:param} b ${v2} c');
/* returns:
        {
          literals: ['a ', ' b ', ' c'],
          variables: [
            { name: 'v1', pipes: [{ name: 'p', parameters: ['param'] }],
            { name: 'v2', pipes: []}
          ]
        }
 */
```

#### `parseStringTemplateGenerator`

```typescript
import { parseStringTemplateGenerator } from 'string-template-parser';
const myParseStringTemplate = parseStringTemplateGenerator({VARIABLE_START: /^\{\{/, VARIABLE_END: /^\}\}/});

myParseStringTemplate('a {{v1|p:param}} b {{v2}} c');
/* returns:
        {
          literals: ['a ', ' b ', ' c'],
          variables: [
            { name: 'v1', pipes: [{ name: 'p', parameters: ['param'] }],
            { name: 'v2', pipes: []}
          ]
        }
 */
```
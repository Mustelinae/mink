# mink
A very simple JavaScript monkeypatcher library with simple error handling.

# Usage
```javascript
// ESM
import * as mink from 'mink';

// CJS
const mink = require('mink');

const exampleObject = { testFunction: () => {} };

// Patches that run before the original function
mink.before('testFunction', exampleObject, (args) => { // args is an array of arguments passed to the function
  console.log('Before');

  // You can return an array to replace the original arguments
}, false); // Change false to true to unpatch after the patch is first called!

exampleObject.testFunction(); // logs "Before"


// Patches that run after the original function
mink.after('testFunction', exampleObject, (args, response) => { // response is the return value of the function
  console.log('After');

  // You can return something to replace the original response
});

exampleObject.testFunction(); // logs "Before", then "After"


// Patches that replace the original function
const unpatch = mink.instead('testFunction', exampleObject, (args, originalFunction) => { // instead patches are passed the original function as the second argument
  console.log('Instead')
});

exampleObject.testFunction(); // logs "Instead" and nothing else

// Unpatches are as simple as running the return value of the patch function
unpatch();
// Now if you call the function it'll log "Before" and "After" again

// You can also unpatch every patch
mink.unpatchAll();

// Patches inherit context from the original function, you just have to use `this`
```

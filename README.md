# Simple & Scientific Calculator

A calculator built with HTML, CSS and JavaScript that works in two modes: a **Simple** calculator for everyday arithmetic and a **Scientific** calculator for advanced functions.

**Live demo:** https://aliraza-datascience.github.io/Simple-and-Scientific-Calculator/

## Features

### Simple mode
- Addition, subtraction, multiplication and division.
- Percentage, brackets and decimal numbers.
- **CE** deletes the last entry and **AC** clears everything.

### Scientific mode
- Trigonometry: sin, cos, tan with the **Inv** key for sin⁻¹, cos⁻¹, tan⁻¹.
- Logarithms and exponents: ln, log, eˣ, 10ˣ, xʸ and x².
- Square root, factorial (x!), π and e.
- **EXP** for scientific notation (for example 2E3 = 2000).
- **Ans** inserts the previous answer.
- **Deg / Rad** switch for angle units.

### General
- Live display of the expression and the result.
- History panel (clock icon) to review and reuse earlier answers.
- Keyboard support: numbers, `+ - * /`, `^`, brackets, `Enter`, `Backspace` and `Esc`.
- Error messages for invalid input and division by zero.
- Calculations use a custom expression parser instead of `eval()`, which keeps them safe.
- Responsive layout for desktop and mobile screens.

## How to use
1. Open `index.html` in a web browser.
2. Use the buttons or your keyboard to enter a calculation and press **=**.
3. Use the link under the keypad to switch between the Simple and Scientific calculator.

## Project structure
```
Calculator/
├── index.html   # Page structure
├── style.css    # Styling and layout
├── script.js    # Calculator logic
└── README.md
``
## Technologies used
HTML5
CSS3 (Grid, Flexbox)
JavaScript (ES6)
- HTML5
- CSS3 (Grid, Flexbox)
- JavaScript (ES6)

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child =>
                typeof child === 'object'
                    ? child
                    : createTextElement(child)
            )
        }
    };
}

function createTextElement(text) {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: []
        }
    };
}

const Didact = {
    createElement
};

/** @jsx Didact.createElement */
const element = (
    <div id='foo'>
        <h1>study react</h1>
        <p>build your own react</p>
    </div>
);
console.log(element);

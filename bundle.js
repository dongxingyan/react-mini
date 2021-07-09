function createElement(type, props, ...children) {
  return {
    type,
    props: { ...props,
      children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
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

const element = Didact.createElement("div", {
  id: "foo"
}, Didact.createElement("h1", null, "study react"), Didact.createElement("p", null, "build your own react"));
console.log(element);

/** @jsx Didact.createElement */
import Didact from './react-mini';
const style = 'width: 100px; height: 30px; line-height: 30px; text-align: center; background-color: red; color: white;';

function Counter() {
  const [state, setState] = Didact.useState(1);
  const [num, setNum] = Didact.useState(1);
  return Didact.createElement("div", null, Didact.createElement("div", {
    onClick: () => {
      setState(c => c + 1);
    },
    style: style
  }, "\u70B9\u51FB\u52A01"), Didact.createElement(Show, {
    state: state
  }), Didact.createElement("div", {
    onClick: () => {
      setNum(c => c + 2);
    },
    style: style
  }, "\u70B9\u51FB\u52A02"), Didact.createElement(Show, {
    state: num
  }));
}

function Show(props) {
  return Didact.createElement("p", null, "\u503C\uFF1A", props.state);
}

function SayHi(props) {
  return Didact.createElement("p", null, "Hi ", props.name);
}

const element = Didact.createElement("div", null, Didact.createElement("h1", {
  style: {
    color: 'red'
  }
}, "\u5BA2\u6237\u4E3A\u5148"), Didact.createElement("a", {
  href: 'http://jd.com'
}, "\u4EAC\u4E1C\u5546\u57CE"), Didact.createElement(SayHi, {
  name: 'msg'
}), Didact.createElement(Counter, null));
const container = document.getElementById('root');
Didact.render(element, container);

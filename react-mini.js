/*
 * @Author: created by dongxingyan
 * @Date: 2021-06-05 14:37:49
 */
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
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

function createDom(fiber) {
    const dom = fiber.type === 'TEXT_ELEMENT'
        ? document.createTextNode('')
        : document.createElement(fiber.type);

    const isProperty = key => key !== 'children';
    Object.keys(fiber.props)
        .filter(isProperty)
        .forEach(name => {
            dom[name] = fiber.props[name];
        });

    return dom;
}

function commitRoot() {
    deletions.forEach(commitWork);
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null;
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }
    let domParentFiber = fiber.parent;
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent;
    }
    const domParent = fiber.parent.dom; ;
    if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    } else if (fiber.effectTag === 'DELETION') {
        commitDeletion(fiber, domParentFiber);
    }
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom);
    } else {
        commitDeletion(fiber.child, domParent);
    }
}

const isEvent = key => key.startsWith('on');
const isProperty = key => key !== 'children' && !isEvent;
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);
function updateDom(dom, prevProps, nextProps) {
// Remove old or change event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key =>
            !(key in nextProps) || isNew(prevProps, nextProps)(key))
        .forEach(name => {
            const eventType = name.toLowerCase()
                .substring(2);
            dom.removeEventListener(eventType, prevProps[name]);
        });

    // remove old property
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(name => {
            dom[name] = '';
        });

    // set new or changed properties
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            dom[name] = nextProps[name];
        });

    // Add event listeners
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2);
            dom.addEventListener(eventType, nextProps[name]);
        });
}

function render(element, container) {
    // element.props.children.forEach(child =>
    //     render(child, dom)
    // );
    // container.appendChild(dom);
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    };
    deletions = [];
    nextUnitOfWork = wipRoot;
    console.log('nextUnitOfWork', nextUnitOfWork);
}
let wipRoot = null;
let currentRoot = null;
let nextUnitOfWork = null;
let deletions = null;

function workLoop(deadline) {
    console.log('workLoop');
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        );
        shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }

    requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function reconcileChildren(wipFiber, elements) {
    const index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling = null;
    while (index < elements.length || oldFiber !== null) {
        const element = elements[index];
        let newFiber = null;
        const sameType = oldFiber && element && element.type === oldFiber;
        if (sameType) {
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: 'UPDATE'
            };
        }
        if (element && !sameType) {
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: 'PLACEMENT'
            };
        };

        if (oldFiber && !sameType) {
            oldFiber.effectTag = 'DELETION';
            deletions.push(oldFiber);
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        if (index === 0) {
            wipFiber.child = newFiber;
        } else {
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
    }
}

function performUnitOfWork(fiber) {
    console.log('fiber===', fiber);

    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber);
    }

    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }

    if (fiber.parent) {
        fiber.parent.dom.appendChild(fiber.dom);
    }

    const elements = fiber.props.children;
    reconcileChildren(fiber, elements);

    let index = 0;
    let prevSibling = null;
    while (index < elements.length) {
        const element = elements[index];
        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null
        };
        if (index === 0) {
            fiber.child = newFiber;
        } else {
            prevSibling.sibling = newFiber;
        }

        prevSibling = newFiber;

        index++;
    }

    if (fiber.child) {
        return fiber.child;
    }
    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }
}

function updateFunctionComponent(fiber) {
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }
    reconcileChildren(fiber, fiber.props.children);
}

const Didact = {
    createElement,
    render
};

const container = document.getElementById('root');

// const updateValue = e => {
//     rerender(e.target.value);
// };
/** @jsx Didact.createElement */
// const rerender = value => {
//     const element = (
//         <div>
//             <input onInput={updateValue} value={value} />
//             <h2>Hello {value}</h2>
//         </div>
//     );
//     Didact.render(element, container);
// };

// rerender('please input');

function App(props) {
    return <h1>Hi {props.name}</h1>;
}
const element = <App name='foo' />;
Didact.render(element, container);

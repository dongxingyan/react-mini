const isProperty = key => key !== 'children' && !isEvent(key);
// 下一个工作单元
let nextUnitOfWork = null;
// 当前要修改的fiber树
let wipRoot = null;
// 上一次提交后的fiber树
let currentRoot = null;
// 旧节点集合
let deletions = null;
// 保存的当前fiber树
let wipFiber = null;
// 当前执行的hook索引，用于区分每次执行哪个hook
let hookIndex = null;
// 是否为新增属性
const isNew = (prev, next) => key => prev[key] !== next[key];
// 是否为要移除的属性
const isGone = (prev, next) => key => !(key in next);
// 是否是事件属性
const isEvent = key => key.startsWith('on');

requestIdleCallback(workLoop);

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

function createDom(fiber) {
    const dom =
      fiber.type === 'TEXT_ELEMENT'
          ? document.createTextNode('')
          : document.createElement(fiber.type);

    updateDom(dom, {}, fiber.props);

    return dom;
}

function updateDom(dom, prevProps, nextProps) {
    // Remove old or changed event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(
            key => !(key in nextProps) ||
            isNew(prevProps, nextProps)(key)
        )
        .forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2);
            dom.removeEventListener(
                eventType,
                prevProps[name]
            );
        });

    // Remove old properties
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(name => {
            dom[name] = '';
        });

    // Set new or changed properties
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
            const eventType = name
                .toLowerCase()
                .substring(2);
            dom.addEventListener(
                eventType,
                nextProps[name]
            );
        });
}

// 将所有的元素添加到dom树
function commitRoot() {
    // 移除旧节点
    deletions.forEach(commitWork);
    // 提交当前fiber树的所有子元素
    commitWork(wipRoot.child);
    // 修改上一次提交的fiber树
    currentRoot = wipRoot;
    // 清空当前fiber树
    wipRoot = null;
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }
    let domParentFiber = fiber.parent;
    // 递归找到 含有 dom 节点的 元素
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent;
    }
    const domParent = domParentFiber.dom;
    if (
        fiber.effectTag === 'PLACEMENT' &&
        fiber.dom != null
    ) {
        domParent.appendChild(fiber.dom);
    } else if (
        fiber.effectTag === 'UPDATE' &&
        fiber.dom != null
    ) {
        updateDom(
            fiber.dom,
            fiber.alternate.props,
            fiber.props
        );
    } else if (fiber.effectTag === 'DELETION') {
        commitDeletion(fiber, domParent);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom);
    } else {
        // 删除节点，一直到有dom节点的元素
        commitDeletion(fiber.child, domParent);
    }
}

function render(element, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    };
    deletions = [];
    nextUnitOfWork = wipRoot;
}

function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        );
        shouldYield = deadline.timeRemaining() < 1;
    }

    // 所有的工作单元执行完后，一并进行提交
    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }

    requestIdleCallback(workLoop);
}

// NOTE: 函数组件的不同点：
// 函数组件没有dom节点
// 函数组件的children属性不在props上，而是通过返回值获取
function performUnitOfWork(fiber) {
    // 判断是否是函数组件
    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber);
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
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];
    // 调用函数组件获取children
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
}

function useState(initial) {
    const oldHook =
      wipFiber.alternate &&
      wipFiber.alternate.hooks &&
      wipFiber.alternate.hooks[hookIndex];

    const hook = {
        // 存在旧值则取旧值，否则取初始值
        state: oldHook ? oldHook.state : initial,
        queue: []
    };

    const actions = oldHook ? oldHook.queue : [];
    actions.forEach(action => {
        hook.state = action(hook.state);
    });

    const setState = action => {
        hook.queue.push(action);
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        };
        // 更新下一个工作单元
        nextUnitOfWork = wipRoot;
        deletions = [];
    };

    wipFiber.hooks.push(hook);
    hookIndex++;
    return [hook.state, setState];
}

function updateHostComponent(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }
    reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(wipFiber, elements) {
    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling = null;

    while (index < elements.length || oldFiber != null) {
        const element = elements[index];
        let newFiber = null;

        const sameType = oldFiber && element && element.type === oldFiber.type;

        // 类型相同，执行更新
        if (sameType) {
        // TODO update the node
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: 'UPDATE'
            };
        }

        // 类型不同，且有新的fiber，执行新增
        if (element && !sameType) {
        // TODO add this node
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: 'PLACEMENT'
            };
        }
        // 类型不同，但是存在旧fiber树，则进行移除
        if (oldFiber && !sameType) {
        // TODO delete the oldFiber's node
            oldFiber.effectTag = 'DELETION';
            deletions.push(oldFiber);
        }
        // 用于下一次循环的时候对兄弟fiber进行比较
        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        if (index === 0) {
            // 如果是第一个子元素，则把新fiber挂到wipFiber的child上
            wipFiber.child = newFiber;
        } else {
            // 其他子元素挂到上一个子元素的sibling属性
            prevSibling.sibling = newFiber;
        }

        prevSibling = newFiber;
        index++;
    }
}

const Didact = {
    createElement,
    render,
    useState
};

/** @jsx Didact.createElement */
const container = document.getElementById('root');

function Counter() {
    const [state, setState] = Didact.useState(1);
    return (
        <div>
            <button onClick={() => setState(c => c + 1)}>点击按钮</button>
            <h1>current Count is: {state}</h1>
        </div>

    );
}

const element = <Counter />;

Didact.render(element, container);

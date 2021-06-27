/*
 * @Author: created by dongxingyan
 * @Date: 2021-06-01 22:10:43
 */
module.exports = {
    parser: 'babel-eslint',
    extends: 'standard',
    env: {
        browser: true,
        commonjs: true,
        es6: true,
        node: true
    },
    parserOptions: {
        // 来启用ES6语法支持
        ecmaVersion: 6,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    plugins: [
        'react'
    ],
    globals: {
        __DEV__: false,
        storage: false,
        isIPhoneX: false,
        iphoneXMarginBottom: false,
        pt: false,
        px: false,
        isAndroid: false,
        isIos: false
    },
    rules: {
        // 强制一行的最大长度
        // "max-len": ['error', 200],
        // 对缩进的详细设置
        indent: ['error', 4, { SwitchCase: 0 }],
        // 单引号
        quotes: ['error', 'single'],
        // [警告]要使用分号
        semi: ['warn', 'always'],
        // [报错]方法声明的方法名与圆括号之间不空格
        'space-before-function-paren': ['error', 'never'],
        //   "no-console": ["error", { allow: ["warn", "error"] }],
        'no-unused-vars': ['error', {
            args: 'after-used'
        }],
        // jsx 内部使用单引号
        'jsx-quotes': ['error', 'prefer-single'],
        // 扩展运算符前不留空格
        'rest-spread-spacing': ['error'],
        // react通过jsx引用组件提示变量定义未使用
        'react/jsx-uses-vars': 'error',
        'react/jsx-tag-spacing': [
            'error',
            {
                closingSlash: 'never',
                beforeSelfClosing: 'always',
                afterOpening: 'never'
            }
        ],
        'multiline-ternary': 0,
        'react/jsx-uses-react': 1, // 防止 React 被错误地标记为未使用
        'react/jsx-key': 'error', // 在数组或迭代器中验证JSX具有key属性
        'react/jsx-no-duplicate-props': 'error',
        'react/no-deprecated': 'warn', // 不使用弃用的方法
        'react/jsx-equals-spacing': 'error', // 在JSX属性中强制或禁止等号周围的空格
        'react/self-closing-comp': 'error', // 防止没有children的组件的额外结束标签
        'react/react-in-jsx-scope': 'error', // 使用JSX时防止丢失React
        'react/no-direct-mutation-state': 'error' // 防止this.state的直接变异
        // "react/prop-types": 'error', //防止在React组件定义中丢失props验证
        // "react/no-multi-comp": 'error', //防止每个文件有多个组件定义
        // "react/jsx-max-props-per-line": ['warn', {"maximum": 2}], // 限制JSX中单行上的props的最大数量
        // "react/no-array-index-key": 'off', //防止在数组中遍历中使用数组key做索引
    }
};

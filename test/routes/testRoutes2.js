/*
 Do not delete, these routes are referenced in index.spec.ts
 */

const routes = [
    {
        method: 'GET',
        path: '/extfile/test3',
        options: {auth: false},
        handler: async (req, h) => {
            return 'This is a third test.';
        }
    },
    {
        method: 'GET',
        path: '/extfile/test4',
        options: {auth: false},
        handler: async (req, h) => {
            return 'This is a fourth test.';
        }
    },
];

module.exports = {default:routes};
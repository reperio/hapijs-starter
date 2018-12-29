/*
 Do not delete, these routes are referenced in index.spec.ts
 */

const routes = [
    {
        method: 'GET',
        path: '/extfile/test',
        options: {auth: false},
        handler: async (req, h) => {
            return 'This is a test.';
        }
    },
    {
        method: 'GET',
        path: '/extfile/test2',
        options: {auth: false},
        handler: async (req, h) => {
            return 'This is another test.';
        }
    },
];

module.exports = {default:routes};
const routes = [
    {
        method: 'GET',
        path: '/extfile/test',
        config: {auth: false},
        handler: async (req, h) => {
            return 'This is a test.';
        }
    },
    {
        method: 'GET',
        path: '/extfile/test2',
        config: {auth: false},
        handler: async (req, h) => {
            return 'This is another test.';
        }
    },
];

module.exports = {default:routes};
import {Request} from 'hapi';

const routes = [
    {
        method: 'GET',
        path: '/test',
        config: {auth: false},
        handler: async (req: Request, h: any) => {
            return 'This is a test.';
        }
    },
    {
        method: 'GET',
        path: '/test2',
        config: {auth: false},
        handler: async (req: Request, h: any) => {
            return 'This is another test.';
        }
    },
];

export default routes;
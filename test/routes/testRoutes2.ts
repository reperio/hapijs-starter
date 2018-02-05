import {Request} from 'hapi';

const routes = [
    {
        method: 'GET',
        path: '/test3',
        config: {auth: false},
        handler: async (req: Request, h: any) => {
            return 'This is a third test.';
        }
    },
    {
        method: 'GET',
        path: '/test4',
        config: {auth: false},
        handler: async (req: Request, h: any) => {
            return 'This is a fourth test.';
        }
    },
];

export default routes;
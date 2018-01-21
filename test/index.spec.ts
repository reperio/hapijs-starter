import Server from '../src/index';

describe('Server', () => {
    it('should export server', () => {
        const server = new Server();

        expect(server).toBeDefined();
    });
});

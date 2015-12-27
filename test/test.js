const should = require('should');
const messageTemplates = require('../src/messageTemplates');

describe('messageTemplates', () => {
  describe('#pushEventSingle', () => {
    const data = {
      repo: { name: 'Istocha/test-repo' },
      payload: {
        ref: 'a/b/master',
        commits: [
          {
            sha: '1234567890qwertyuiop',
            author: { name: 'Istanbul Mocha' },
            message: 'This is a sample commit.'
          }
        ]
      }
    };
    const result = messageTemplates.pushEventSingle(data);

    it('should return a correctly formatted string', () => {
      const expectedText = '[Istocha/test-repo:master] 1 new commit by Istanbul Mocha:\n#{0}: This is a sample commit. - Istanbul Mocha';

      should(result.text).equal(expectedText);
    });

    it('should return a single url', () => {
      should(result.urls.length).equal(1);
    });
  });
});

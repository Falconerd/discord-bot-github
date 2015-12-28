import { should } from 'should';
import { summat } from '../src/index';

describe('Summat', () => {
  it('does summat', () => {
    should(summat).be.equal.to(0);
  });
});

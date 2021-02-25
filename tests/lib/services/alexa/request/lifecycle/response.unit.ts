import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import { responseGenerator } from '@/lib/services/alexa/request/lifecycle/response';

describe('response lifecycle unit tests', () => {
  it('works correctly', async () => {
    const responseHandler1 = sinon.stub();
    const responseHandler2 = sinon.stub();

    const utils = { responseHandlers: [responseHandler1, responseHandler2] };

    const response = responseGenerator(utils);

    const finalState = 'final-state';
    const storageGet = sinon.stub().returns('speak');
    const turnGet = sinon.stub();
    turnGet.onFirstCall().returns(null);
    turnGet.onSecondCall().returns(true);

    const runtime = {
      storage: { get: storageGet },
      turn: { get: turnGet, set: sinon.stub() },
      stack: { isEmpty: sinon.stub().returns(true) },
      getFinalState: sinon.stub().returns(finalState),
    };
    const accessToken = 'access-token';
    const output = 'output';

    const reprompt = sinon.stub();
    const input = {
      responseBuilder: { getResponse: sinon.stub().returns(output), speak: sinon.stub().returns({ reprompt }), withShouldEndSession: sinon.stub() },
      requestEnvelope: { runtime: { System: { user: { accessToken } } } },
      attributesManager: { setPersistentAttributes: sinon.stub() },
    };

    expect(await response(runtime as any, input as any)).to.eql(output);
    expect(runtime.turn.set.args).to.eql([[T.END, true]]);
    expect(runtime.storage.get.args).to.eql([[S.OUTPUT], [S.OUTPUT]]);
    expect(input.responseBuilder.speak.args).to.eql([['speak']]);
    expect(reprompt.args).to.eql([['speak']]);
    expect(responseHandler1.args).to.eql([[runtime, input.responseBuilder]]);
    expect(responseHandler2.args).to.eql([[runtime, input.responseBuilder]]);
    expect(input.responseBuilder.withShouldEndSession.args).to.eql([[true]]);
    expect(input.attributesManager.setPersistentAttributes.args).to.eql([[finalState]]);
  });

  it('stack not empty', async () => {
    const utils = { responseHandlers: [] };

    const response = responseGenerator(utils);

    const runtime = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('speak') },
      turn: { get: sinon.stub().returns(true) },
      stack: { isEmpty: sinon.stub().returns(false) },
      getFinalState: sinon.stub().returns({}),
    };
    const output = 'output';

    const input = {
      responseBuilder: {
        getResponse: sinon.stub().returns(output),
        speak: sinon.stub().returns({ reprompt: sinon.stub() }),
        withShouldEndSession: sinon.stub(),
      },
      requestEnvelope: { runtime: { System: { user: { accessToken: 'access-token' } } } },
      attributesManager: { setPersistentAttributes: sinon.stub() },
    };

    expect(await response(runtime as any, input as any)).to.eql(output);
  });
});

import { describe } from 'vitest';
import { test } from './asserts';
const model = `
  specification {
    element component
    tag mytag
  }
  model {
    component user
    component system {
      component backend
      component frontend
    }
    component other {
      component service
    }
  }
`;
describe('views-rank', () => {
    test('valid rank expressions').valid `${model}
    views {
      view {
        include *
        rank same { user, system }
        rank min { user }
        rank max { system.backend }
        rank source { user }
        rank sink { system.frontend }
      }
    }`;
    test('valid rank expressions with whitespace separator').valid `${model}
    views {
      view {
        include *
        rank same { user, system }
        rank same { system.backend, system.frontend }
      }
    }`;
    test('valid rank expressions with same container').valid `${model}
    views {
      view {
        include *
        rank same { system.backend, system.frontend }
      }
    }`;
    test('valid rank with default same value').valid `${model}
    views {
      view {
        include *
        rank { user, system }
      }
    }`;
    test('invalid rank value').invalid `${model}
    views {
      view {
        include *
        rank invalid { user }
      }
    }`;
    test('missing targets').invalid `${model}
    views {
      view {
        include *
        rank same { }
      }
    }`;
    test('invalid rank targets: different containers').invalid `${model}
    views {
      view {
        include *
        rank same { system.backend, other.service }
      }
    }`;
    test('valid rank min/max/source/sink with different containers').valid `${model}
    views {
      view {
        include *
        rank min { system.backend, other.service }
        rank max { system.frontend, other.service }
        rank source { user, system.backend }
        rank sink { user, other.service }
      }
    }`;
    test('invalid rank targets: wildcard').invalid `${model}
    views {
      view {
        include *
        rank same { * }
      }
    }`;
    test('invalid rank targets: tag').invalid `${model}
    views {
      view {
        include *
        rank same { element.tag=#mytag }
      }
    }`;
});

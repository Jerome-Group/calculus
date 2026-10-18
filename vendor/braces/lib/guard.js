'use strict';

const MAX_AST_DEPTH = 128;
const MAX_PARENT_DEPTH = MAX_AST_DEPTH + 1;
const MAX_AST_VISITS = 262144;

const error = (ErrorType, code, message) => Object.assign(new ErrorType(message), { code });
const depthError = () => error(RangeError, 'ERR_BRACES_DEPTH_LIMIT', 'Brace AST exceeds the fixed depth limit');

const assertDepth = depth => {
  if (depth > MAX_AST_DEPTH) throw depthError();
};

const assertAst = ast => {
  const pending = [{ node: ast, depth: ast && ast.type === 'root' ? 0 : 1, index: -1 }];
  const active = new WeakSet();
  const parentDepths = new WeakMap();
  const checkedQueues = new WeakSet();
  let visits = 0;

  const visit = () => {
    if (++visits > MAX_AST_VISITS) {
      throw error(RangeError, 'ERR_BRACES_NODE_LIMIT', 'Brace AST exceeds the fixed node visit limit');
    }
  };

  const assertQueue = queue => {
    if (!Array.isArray(queue) || checkedQueues.has(queue)) return;
    const arrays = [{ array: queue, depth: 1, index: -1 }];
    const activeArrays = new WeakSet();

    while (arrays.length > 0) {
      const frame = arrays[arrays.length - 1];
      const { array, depth } = frame;
      if (frame.index === -1) {
        visit();
        if (activeArrays.has(array)) {
          throw error(TypeError, 'ERR_BRACES_CYCLE', 'Cyclic brace AST queue');
        }
        assertDepth(depth);
        activeArrays.add(array);
        frame.index = 0;
      }
      if (frame.index === array.length) {
        activeArrays.delete(array);
        arrays.pop();
      } else {
        const child = array[frame.index++];
        if (Array.isArray(child)) arrays.push({ array: child, depth: depth + 1, index: -1 });
        else visit();
      }
    }
    checkedQueues.add(queue);
  };

  while (pending.length > 0) {
    const frame = pending[pending.length - 1];
    const { node, depth } = frame;

    if (frame.index === -1) {
      if (!node || typeof node !== 'object') {
        throw error(TypeError, 'ERR_BRACES_INVALID_AST', 'Invalid brace AST node');
      }
      visit();
      if (active.has(node)) {
        throw error(TypeError, 'ERR_BRACES_CYCLE', 'Cyclic brace AST');
      }

      let ancestor = node;
      const chain = [];
      const ancestors = new WeakSet();
      while (ancestor != null && !parentDepths.has(ancestor)) {
        if (typeof ancestor !== 'object') {
          throw error(TypeError, 'ERR_BRACES_INVALID_AST', 'Invalid brace AST parent');
        }
        if (ancestors.has(ancestor)) {
          throw error(TypeError, 'ERR_BRACES_CYCLE', 'Cyclic brace AST parent');
        }
        if (chain.length > MAX_PARENT_DEPTH) throw depthError();
        if (ancestor !== node) visit();
        assertQueue(ancestor.queue);
        ancestors.add(ancestor);
        chain.push(ancestor);
        ancestor = ancestor.parent;
      }
      let parentDepth = ancestor == null ? -1 : parentDepths.get(ancestor);
      while (chain.length > 0) {
        if (++parentDepth > MAX_PARENT_DEPTH) throw depthError();
        parentDepths.set(chain.pop(), parentDepth);
      }

      if (node.value !== undefined && typeof node.value !== 'string') {
        throw error(TypeError, 'ERR_BRACES_INVALID_AST', 'Invalid brace AST value');
      }
      if (node.nodes === undefined) {
        pending.pop();
        continue;
      }
      if (!Array.isArray(node.nodes)) {
        throw error(TypeError, 'ERR_BRACES_INVALID_AST', 'Invalid brace AST children');
      }
      assertDepth(depth);
      active.add(node);
      frame.index = 0;
    }

    if (frame.index === node.nodes.length) {
      active.delete(node);
      pending.pop();
    } else {
      pending.push({ node: node.nodes[frame.index++], depth: depth + 1, index: -1 });
    }
  }
};

module.exports = { assertDepth, assertAst };

/**
 * If use this, mind that you should push to attributes or directives manually
 * If we detected that key is an regexp, we will use Regexp() to match
 * If more than one match, newer will override older
 */

import { AttributeNode, JsxNode } from '../jsxNode';
import { NodeTypes } from '../util/constant';
import is from './is'
import v from './v-'

export const defaultAttrTransform = (name: string, value: any, jsxNode: JsxNode) => {
  const attributeNode: AttributeNode = {
    type: NodeTypes.ATTRIBUTE,
    name,
    value,
  };
  jsxNode.attributes.push(attributeNode);
}

const internalMap = new Map()
internalMap.set('is', is)
internalMap.set(/^v-/g, v)

export default internalMap
// @ts-nocheck
// https://facebook.github.io/jsx
import jsx from "@babel/plugin-syntax-jsx";
import htmlTags from 'html-tags'
import svgTags from 'svg-tags'
import template from '@babel/template'

const directiveKey = Symbol('directive')
const slotKey = Symbol('slot')

const isDirective = (attr) => attr.startsWith('v-')
const internalDirective = ['v-show', 'v-on', 'v-model']
const isSlot = (attr) => attr.startsWith('v-slot')

/**
 * Transform JSXText to StringLiteral
 * @param t
 * @param path JSXText
 * @returns StringLiteral
 */
const transformJSXText = (t, path) => {
  const node = path.node
  const lines = node.value.split(/\r\n|\n|\r/)

  let lastNonEmptyLine = 0

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/[^ \t]/)) {
      lastNonEmptyLine = i
    }
  }

  let str = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const isFirstLine = i === 0
    const isLastLine = i === lines.length - 1
    const isLastNonEmptyLine = i === lastNonEmptyLine

    // replace rendered whitespace tabs with spaces
    let trimmedLine = line.replace(/\t/g, ' ')

    // trim whitespace touching a newline
    if (!isFirstLine) {
      trimmedLine = trimmedLine.replace(/^[ ]+/, '')
    }

    // trim whitespace touching an endline
    if (!isLastLine) {
      trimmedLine = trimmedLine.replace(/[ ]+$/, '')
    }

    if (trimmedLine) {
      if (!isLastNonEmptyLine) {
        trimmedLine += ' '
      }

      str += trimmedLine
    }
  }

  return str !== '' ? t.stringLiteral(str) : null
}
/**
 * Transform JSXExpressionContainer to Expression
 * @param t
 * @param path JSXExpressionContainer
 * @returns Expression
 */
const transformJSXExpressionContainer = (t, path) => path.get('expression').node
/**
 * Transform JSXSpreadChild
 * @param t
 * @param path JSXSpreadChild
 * @returns SpreadElement
 */
const transformJSXSpreadChild = (t, path) => t.spreadElement(path.get('expression').node)

const genSlot = () => {

}
/**
 * Parse vue attribute from JSXAttribute
 * @param t
 * @param path JSXAttribute
 * @param attributes Object<[type: string]: ObjectExpression>
 * @param tagName string
 * @param elementType string
 * @returns Array<Expression>
 */
const parseAttributeJSXAttribute = (t, path, attributes) => {
  let nameNode = path.get('name')
  let namespace = ''
  let name = ''
  if(t.isJSXNamespacedName(nameNode)) {
    namespace = nameNode.node.namespace.name
    name = nameNode.node.name.name
  } else {
    namespace = nameNode.node.name
  }
  let value = path.get('value').node

  if (t.isJSXExpressionContainer(value)) {
    value = value.expression
  } else {
    if(!value && !isSlot(namespace)) {
      value = t.booleanLiteral(true)
    }
  }

  if(isDirective(namespace)) {
    if(isSlot(namespace)) {
      name = name || 'default'
      attributes[slotKey].push([name,value])
    } else {
      attributes[directiveKey].push([namespace, value])
    }
  } else {
    attributes[namespace] = value
  }
}

/**
 * Transform attributes to ObjectExpression
 * @param t
 * @param attributes Object<[type: string]: ObjectExpression>
 * @returns ObjectExpression
 */

const transformAttributes = (t, attributes, spread) => {
  return t.objectExpression(Object.entries(attributes).map(
    ([key, value]) => t.objectProperty(t.stringLiteral(key), value),
  ).concat(spread));
}

/**
 * Get tag (first attribute for h) from JSXOpeningElement
 * @param t
 * @param path JSXOpeningElement
 * @returns Identifier | StringLiteral | MemberExpression
 */
const getTag = (t, path) => {
  const namePath = path.get('name')
  if (t.isJSXIdentifier(namePath)) {
    const name = namePath.get('name').node
    if (path.scope.hasBinding(name) && !htmlTags.includes(name) && !svgTags.includes(name)) {
      return t.identifier(name)
    } else {
      return t.stringLiteral(name)
    }
  }

  if (t.isJSXMemberExpression(namePath)) {
    // TODO: transformJSXMemberExpression?
    // return transformJSXMemberExpression(t, namePath)
  }

  throw new Error(`getTag: ${namePath.type} is not supported`)
}

/**
 * Get attributes from Array of JSX attributes
 * @param t
 * @param paths Array<JSXAttribute | JSXSpreadAttribute>
 * @param tag Identifier | StringLiteral | MemberExpression
 * @param openingElementPath JSXOpeningElement
 * @returns Array<Expression>
 */
const getAttributes = (t, paths, tag, openingElementPath) => {
  let attributes = {
    [directiveKey]: [],
    [slotKey]: []
  }
  const spread = []
  paths.forEach(path => {
    if(t.isJSXAttribute(path)) {
      parseAttributeJSXAttribute(t, path, attributes)
    }
    if (t.isJSXSpreadAttribute(path)) {
      spread.push(t.spreadElement(path.get('argument').node))
    }
  })
  const directives = attributes[directiveKey]
  delete attributes[directiveKey]

  const slots = attributes[slotKey]
  delete attributes[slotKey]

  return {
    data: transformAttributes(t, attributes, spread),
    directives,
    slots
  }
}

/**
 * Get children from Array of JSX children
 * @param t
 * @param paths Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement>
 * @returns Array<Expression | SpreadElement>
 */
const getChildren = (t, paths) =>
  paths
    .map(path => {
      if (path.isJSXText()) {
        return transformJSXText(t, path)
      }
      if (path.isJSXExpressionContainer()) {
        return transformJSXExpressionContainer(t, path)
      }
      if (path.isJSXSpreadChild()) {
        return transformJSXSpreadChild(t, path)
      }
      if (path.isCallExpression()) {
        return path.node
      }
      /* istanbul ignore next */
      throw new Error(`getChildren: ${path.type} is not supported`)
    })
    .filter(el => el !== null && !t.isJSXEmptyExpression(el))

const normalizeName = (name, addVueImportSpecifier) => {
  if(internalDirective.includes(name)) {
    const dirName = name.split('-')[1]
    const normalizedName = 'v' + dirName.slice(0, 1).toUpperCase() + dirName.slice(1)
    addVueImportSpecifier(normalizedName)
    return normalizedName
  } else {
    return name.split('-')[1]
  }
}

const genDirective = (t, call, directives, addVueImportSpecifier) => {
  const withDirectives = t.identifier('withDirectives')
  addVueImportSpecifier('withDirectives')
  directives.forEach((dir) => {
    const normalizedName = normalizeName(dir[0], addVueImportSpecifier)
    dir[0] = t.identifier(normalizedName)
  })
  directives = directives.map( dir => t.arrayExpression(dir))
  return t.callExpression(withDirectives, [call, t.arrayExpression(directives)])
}

const genSlotFunction = (t, children, params) => {
  if(!params) {
    params = []
  } else if(t.isSequenceExpression(params)) {
    params = params.expression
  } else if(t.isStringLiteral(params)) {
    params = [t.identifier(params.value)]
  } else {
    params = [params]
  }
  const returnCall = t.arrayExpression(children)
  return t.arrowFunctionExpression(params, t.blockStatement([t.returnStatement(returnCall)]))
}

// Builds JSX Fragment <></> into
// Production: h(type, arguments, children)
function transformJSXElement(t, path, addVueImportSpecifier) {
  const openingElementPath = path.get('openingElement')
  const tag = getTag(t, openingElementPath)
  const children = getChildren(t, path.get('children'))
  const createElement = t.identifier('h');
  const attributes = getAttributes(t, openingElementPath.get('attributes'), tag, openingElementPath)
  const slots = []
  const args = [tag, attributes.data]
  // transform children to slots
  if (children.length) {
    const namedSlots = children.filter(child => child.slot && child.slot.length!==0)
    const defaultSlots = children.filter(child => !child.slot || child.slot.length===0)
    slots.push(t.objectProperty(t.identifier('default'), genSlotFunction(t, defaultSlots)))
    namedSlots.forEach(callExpression => {
      callExpression.slot.forEach(slot => {
        slots.push(t.objectProperty(t.identifier(slot[0]), genSlotFunction(t, [callExpression], slot[1])))
      })
    })
    args.push(t.ObjectExpression(slots))
  }
  const callExpression = t.callExpression(createElement, args)
  callExpression.slot = attributes.slots

  // add directive
  if(attributes.directives && attributes.directives.length!==0) {
    const directiveCallExpression = genDirective(t, callExpression, attributes.directives, addVueImportSpecifier)
    directiveCallExpression.slot = attributes.slots
    return directiveCallExpression
  } else {
    return callExpression
  }
}

// judge vue imported
function hasImportedVue(path) {
  const body = path.node.body
  for(let i=0;i<body.length;i++) {
    const p = body[i]
    if(p.type === 'ImportDeclaration' && p.source.value == 'vue') {
      return p
    }
  }
  return false
};

function genAddImportSpecifier(t, specifiers) {
  const keys = specifiers.filter(function (s) {
    return s.imported !== undefined;
  }).map(function (s) {
    return s.imported.name;
  });
  return (s) => {
    if (!keys.includes(s)) {
      specifiers.unshift(t.ImportSpecifier(t.identifier(s), t.identifier(s)));
    }
  }
}

// inject "import {h} from 'vue'"
function inject(t, path) {
  let addImportSpecifier;
  const importedVue = hasImportedVue(path)
  if(importedVue) {
    addImportSpecifier = genAddImportSpecifier(t, importedVue.specifiers)
    addImportSpecifier('h');
  } else {
    const vueImportDeclaration = template.ast('import {h} from "vue"')
    path.node.body.unshift(vueImportDeclaration)
    addImportSpecifier = genAddImportSpecifier(t, vueImportDeclaration.specifiers)
  }
  return addImportSpecifier
}

export default ({types}) => {
  return {
    name: 'babel-plugin-vue-next-jsx',
    inherits: jsx,
    visitor: {
      JSXElement: {
        exit(path) {
          const addVueImportSpecifier = inject(types, path.hub.file.path)
          path.replaceWith(transformJSXElement(types, path, addVueImportSpecifier))
        },
      }
    },
  }
}

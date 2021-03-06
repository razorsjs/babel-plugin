import { compare, transformWithPlugin, vueCompiled } from './util';

describe('patchFlag analysis', () => {
  test('TEXT', () => {
    const jsxCode1 = '<div>foo</div>'
    const vueCode1 = '<div>foo</div>'

    const jsxCode2 = '<div>{ foo }</div>'
    const vueCode2 = '<div>{{ foo }}</div>'

    const jsxCode3 = '<div>foo { bar } baz</div>'
    const vueCode3 = '<div>foo {{ bar }} baz</div>'

    expect(transformWithPlugin(jsxCode1)).toBe(vueCompiled(vueCode1))
    expect(transformWithPlugin(jsxCode2)).toBe(vueCompiled(vueCode2))
    expect(transformWithPlugin(jsxCode3)).toBe(vueCompiled(vueCode3))
  })
  test('CLASS', () => {
    const jsxCode = '<div class={foo}></div>'
    const vueCode = '<div :class="foo"></div>'
    expect(transformWithPlugin(jsxCode)).toBe(vueCompiled(vueCode))
  })
  test('STYLE', () => {
    const jsxCode = '<div style={foo}></div>'
    const vueCode = '<div :style="foo"></div>'
    expect(transformWithPlugin(jsxCode)).toBe(vueCompiled(vueCode))
  })
  test('PROPS', () => {
    const jsxCode = '<div id="foo" foo={bar} baz={qux} />'
    const vueCode = '<div id="foo" :foo="bar" :baz="qux" />'
    expect(transformWithPlugin(jsxCode)).toBe(vueCompiled(vueCode))
  })
  test('CLASS + STYLE + PROPS', () => {
    const jsxCode = '<div id="foo" class={cls} style={styl} foo={bar} baz={qux} />'
    const vueCode = '<div id="foo" :class="cls" :style="styl" :foo="bar" :baz="qux"/>'
    expect(transformWithPlugin(jsxCode)).toBe(vueCompiled(vueCode))
  })
  test('PROPS on component', () => {
    const jsxCode = '<Foo id={foo} class={cls} style={styl} />'
    const vueCode = '<Foo :id="foo" :class="cls" :style="styl" />'
    expect(transformWithPlugin(jsxCode)).toBe(vueCompiled(vueCode))
  })
  test('FULL_PROPS (v-bind)', () => {
    const jsxCode = '<div v-bind={[foo]} />'
    const vueCode = '<div v-bind="foo" />'
    expect(transformWithPlugin(jsxCode)).toBe(vueCompiled(vueCode))
  })
  test('FULL_PROPS (dynamic key)', () => {
    const jsxCode = '<div v-bind={[foo, bar]} />'
    const vueCode = '<div :[foo]="bar" />'
    expect(transformWithPlugin(jsxCode)).toBe(vueCompiled(vueCode))
  })
  test('FULL_PROPS (w/ others)', () => {
    const jsxCode = '<div id="foo" v-bind={[bar]} class={cls} />'
    const vueCode = '<div id="foo" v-bind="bar" :class="cls" />'
    expect(transformWithPlugin(jsxCode)).toBe(vueCompiled(vueCode))
  })
  test('NEED_PATCH (static ref)', () => {
    const code = '<div ref="foo" />'
    compare(code)
  })
  test('NEED_PATCH (dynamic ref)', () => {
    const jsxCode = '<div ref={foo} />'
    const vueCode = '<div :ref="foo" />'
    expect(transformWithPlugin(jsxCode)).toBe(vueCompiled(vueCode))
  })
  test('NEED_PATCH (custom directives)', () => {
    const code = '<div v-foo />'
    compare(code)
  })
  test('HYDRATE_EVENTS', () => {
    const jsxCode1 = '<div onClick={foo} />'
    const vueCode1 = '<div @click="foo" />'
    const jsxCode2 = '<div onKeyup={foo} />'
    const vueCode2 = '<div @keyup="foo" />'
    expect(transformWithPlugin(jsxCode1)).toBe(vueCompiled(vueCode1))
    expect(transformWithPlugin(jsxCode2)).toBe(vueCompiled(vueCode2))
  })
  test('mixed all', () => {
    const jsxCode = '<div onTest={test} a={a} class={a} style={test}>{a}</div>'
    const vueCode = '<div @test="test" :a="a" :class="a" :style="test">{{a}}</div>'
    expect(transformWithPlugin(jsxCode)).toBe(vueCompiled(vueCode))
  })
})

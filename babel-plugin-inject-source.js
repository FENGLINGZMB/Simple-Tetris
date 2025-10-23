// Babel插件：在构建时注入精确的源码位置信息
export default function injectSourcePlugin({ types: t }) {
    return {
      name: 'inject-source-location-enhanced',
      visitor: {
        JSXElement(path, state) {
          const { node } = path;
          const filename = state.filename || state.file.opts.filename || 'unknown';
          
          // 获取精确的源码位置
          const start = node.loc?.start;
          const end = node.loc?.end;
          if (!start) return;
          
          // 清理文件路径（相对于项目根目录）
          const relativePath = filename
            .replace(/^.*\/src\//, 'src/')
            .replace(/\\/g, '/');
          
          // 精确的位置信息
          const sourceLocation = `${relativePath}:${start.line}:${start.column + 1}`;
          const elementType = getElementType(node.openingElement.name);
          
          // 提取更多上下文信息
          const elementInfo = {
            fileName: relativePath,
            lineNumber: start.line,
            columnNumber: start.column + 1,
            endLine: end?.line || start.line,
            endColumn: end?.column ? end.column + 1 : start.column + 1,
            elementType: elementType,
            tagName: elementType.toLowerCase(),
            // 获取元素的属性信息
            attributes: node.openingElement.attributes.map(attr => {
              if (attr.type === 'JSXAttribute' && attr.name) {
                return {
                  name: attr.name.name,
                  hasValue: !!attr.value,
                  line: attr.loc?.start?.line,
                  column: attr.loc?.start?.column
                };
              }
              return null;
            }).filter(Boolean),
            // 记录是否有子元素
            hasChildren: node.children && node.children.length > 0,
            // 记录父元素信息（如果可获得）
            parentElement: getParentElementType(path.parent)
          };
          
          // 创建增强的源码位置属性
          const sourceLocationAttr = t.jsxAttribute(
            t.jsxIdentifier('data-source-location'),
            t.stringLiteral(sourceLocation)
          );
          
          // 创建增强的源码栈属性
          const sourceStackAttr = t.jsxAttribute(
            t.jsxIdentifier('data-source-stack'),
            t.stringLiteral(JSON.stringify(elementInfo))
          );
          
          // 创建元素类型属性（便于调试）
          const elementTypeAttr = t.jsxAttribute(
            t.jsxIdentifier('data-element-type'),
            t.stringLiteral(elementType)
          );
          
          // 创建行号属性（便于快速访问）
          const lineNumberAttr = t.jsxAttribute(
            t.jsxIdentifier('data-line-number'),
            t.stringLiteral(start.line.toString())
          );
          
          // 创建运行时注入标记
          const runtimeFileAttr = t.jsxAttribute(
            t.jsxIdentifier('data-real-file'),
            t.stringLiteral(relativePath)
          );
          
          const runtimeLineAttr = t.jsxAttribute(
            t.jsxIdentifier('data-real-line'),
            t.stringLiteral(start.line.toString())
          );
          
          const runtimeColumnAttr = t.jsxAttribute(
            t.jsxIdentifier('data-real-column'),
            t.stringLiteral((start.column + 1).toString())
          );
          
          const injectionMethodAttr = t.jsxAttribute(
            t.jsxIdentifier('data-injected-source'),
            t.stringLiteral('babel')
          );
          
          // 添加所有属性到JSX元素
          node.openingElement.attributes.push(
            sourceLocationAttr,
            sourceStackAttr,
            elementTypeAttr,
            lineNumberAttr,
            runtimeFileAttr,
            runtimeLineAttr,
            runtimeColumnAttr,
            injectionMethodAttr
          );
        }
      }
    };
  }
  
  function getElementType(nameNode) {
    if (nameNode.type === 'JSXIdentifier') {
      return nameNode.name;
    } else if (nameNode.type === 'JSXMemberExpression') {
      return `${nameNode.object.name}.${nameNode.property.name}`;
    }
    return 'unknown';
  }
  
  function getParentElementType(parentNode) {
    if (parentNode && parentNode.type === 'JSXElement' && parentNode.openingElement) {
      return getElementType(parentNode.openingElement.name);
    }
    return null;
  } 
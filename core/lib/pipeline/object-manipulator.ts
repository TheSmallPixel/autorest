/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Clone, CloneAst, DataHandle, DataSink, Descendants, IsPrefix, JsonPath, Mapping, nodes, ParseNode, paths, ReplaceNode, ResolveRelativeNode, SmartPosition, stringify, StringifyAst, ToAst, YAMLNode, ParseToAst } from '@azure-tools/datastore';
import { From } from 'linq-es2015';
import { IdentitySourceMapping } from '../source-map/merging';

export async function manipulateObject(
  src: DataHandle,
  target: DataSink,
  whereJsonQuery: string,
  transformer: (doc: any, obj: any, path: JsonPath) => any, // transforming to `undefined` results in removal
  mappingInfo?: {
    transformerSourceHandle: DataHandle;
    transformerSourcePosition: SmartPosition;
    reason: string;
  }): Promise<{ anyHit: boolean; result: DataHandle }> {

  if (whereJsonQuery === '$') {
    const data = await src.ReadData();
    const newObject = transformer(null, data, []);
    if (newObject !== data) {
      const resultHandle = await target.WriteData(src.Description, newObject, src.identity, src.artifactType, undefined, mappingInfo ? [src, mappingInfo.transformerSourceHandle] : [src]);
      return {
        anyHit: true,
        result: resultHandle
      };
    }
  }


  // find paths matched by `whereJsonQuery`

  let ast: YAMLNode = CloneAst(await src.ReadYamlAst());
  const doc = ParseNode<any>(ast);
  const hits = nodes(doc, whereJsonQuery).sort((a, b) => a.path.length - b.path.length);
  if (hits.length === 0) {
    return { anyHit: false, result: src };
  }

  // process
  const mapping = IdentitySourceMapping(src.key, ast).filter(m => !hits.some(hit => IsPrefix(hit.path, (<any>m.generated).path)));
  for (const hit of hits) {
    if (ast === undefined) {
      throw new Error('Cannot remove root node.');
    }
    const newObject = transformer(doc, Clone(hit.value), hit.path);
    const newAst = newObject === undefined
      ? undefined
      : ToAst(newObject); // <- can extend ToAst to also take an "ambient" object with AST, in order to create anchor refs for existing stuff!
    const oldAst = ResolveRelativeNode(ast, ast, hit.path);
    ast = ReplaceNode(ast, oldAst, newAst) || (() => { throw new Error('Cannot remove root node.'); })();
    /*
        // patch source map
        if (newAst !== undefined) {
          const reasonSuffix = mappingInfo ? ` (${mappingInfo.reason})` : '';
          if (mappingInfo) {
            mapping.push(
              ...From(Descendants(newAst)).Select((descendant: any) => {
                return <Mapping>{
                  name: `Injected object at '${stringify(hit.path)}'${reasonSuffix}`,
                  source: mappingInfo.transformerSourceHandle.key,
                  original: mappingInfo.transformerSourcePosition,
                  generated: { path: hit.path.concat(descendant.path) }
                };
              }));
          }
    
          // try to be smart and assume that nodes existing in both old and new AST have a relationship
          mapping.push(
            ...From(Descendants(newAst))
              .Where((descendant: any) => paths(doc, stringify(hit.path.concat(descendant.path))).length === 1)
              .Select((descendant: any) => {
                return <Mapping>{
                  name: `Original object at '${stringify(hit.path)}'${reasonSuffix}`,
                  source: src.key,
                  original: { path: hit.path.concat(descendant.path) },
                  generated: { path: hit.path.concat(descendant.path) }
                };
              }));
        }
        */
  }

  // write back
  const resultHandle = await target.WriteData('manipulated', StringifyAst(ast), src.identity, undefined, mapping, mappingInfo ? [src, mappingInfo.transformerSourceHandle] : [src]);
  return {
    anyHit: true,
    result: resultHandle
  };
}

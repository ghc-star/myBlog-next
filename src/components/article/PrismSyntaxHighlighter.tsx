"use client";

import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";

// 按需注册语言：全量 Prism 构建含所有语言（约 650KB chunk），
// 这里只注册技术博客常用语种；未注册的语言会自动降级为纯文本，不会报错。
// 语言模块来自 refractor，自带自身依赖（如 tsx 会带上 jsx/typescript）和常用别名（ts/js/py…）。
// registerLanguage 的第一个参数在运行时会被忽略（refractor 按语言定义自身的名字注册），仅用于类型。
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import c from "react-syntax-highlighter/dist/esm/languages/prism/c";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import diff from "react-syntax-highlighter/dist/esm/languages/prism/diff";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";

const languages: Record<string, unknown> = {
  bash,
  c,
  cpp,
  css,
  diff,
  go,
  java,
  javascript,
  json,
  jsx,
  markdown,
  markup,
  python,
  sql,
  tsx,
  typescript,
  yaml,
};

for (const [name, language] of Object.entries(languages)) {
  SyntaxHighlighter.registerLanguage(name, language);
}

export default SyntaxHighlighter;

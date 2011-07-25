var ncss = require('../lib/ncss');

describe("test minification", function() {

  it("should remove trailing semicolons", function() {
    expect(ncss(".class {padding:2px 2pt;}"))
      .toEqual(".class{padding:2px 2pt}");
  });

  it("should delete comments", function() {
    expect(ncss("/*****\nMulti-line comment\nbefore a new class name\n****/\n.classname {\n/* comment in declaration block */\nfont-weight: normal;\n}"))
      .toEqual(".classname{font-weight:normal}");
  });

  it('should not delete special comments', function() {
    expect(ncss("/*! (c) Copyright MMCVI Foo Bar */"))
      .toEqual("/*! (c) Copyright MMCVI Foo Bar */");
  });

  it('should remove extra semicolons', function() {
    expect(ncss(".noextrasemicolons {border-top: 1px; ;border-bottom: 2px;;;}"))
      .toEqual(".noextrasemicolons{border-top:1px;border-bottom:2px}");
  });

  it("should remove empty rules", function() {
    expect(ncss(".empty { ;}"))
      .toEqual("");
    expect(ncss("#id empty {}"))
      .toEqual("");
  });

  it("should remove units from 0", function() {
    expect(ncss("pre{margin:0pt}"))
      .toEqual("pre{margin:0}");
    expect(ncss("pre{margin:0pt 0px}"))
      .toEqual("pre{margin:0}");
    expect(ncss("a {margin: 0px 0pt 0em 0%;background-position: 0 0ex;padding: 0in 0cm 0mm 0pc}"))
      .toEqual("a{margin:0;background-position:0 0;padding:0}");
    expect(ncss("#id pre {margin: 0 0px;padding: 0pt 0 0;}"))
      .toEqual("#id pre{margin:0;padding:0}");
    expect(ncss("a{background-position: 0 0 0 0;}"))
      .toEqual("a{background-position:0 0}");
  });

  it("should drop the leading 0 for floats < 1", function() {
    expect(ncss(".float {margin: 0.6px 0.333pt 1.2em;}"))
      .toEqual(".float{margin:.6px .333pt 1.2em}");
  });

  it("should convert rgb() to hex", function() {
    expect(ncss(".colors {color: rgb(123, 123, 123);background: none repeat scroll 0 0 rgb(255, 0, 0);}"))
      .toEqual(".colors{color:#7b7b7b;background:none repeat scroll 0 0 #f00}");
  });

  it("should shorten hex colors", function() {
    expect(ncss(".colors {border-color: #ffeedd}"))
      .toEqual(".colors{border-color:#fed}");
  });

  it("should not convert rgba", function() {
    expect(ncss(".cantouch {color: rgba(1, 2, 3, 4);}"))
      .toEqual(".cantouch{color:rgba(1,2,3,4)}");
  });

  it("should not convert hex in filters", function() {
    expect(ncss('.cantouch {filter: chroma(color="#FFFFFF");}'))
      .toEqual('.cantouch{filter:chroma(color="#FFFFFF")}');
  });

  it("should only allow one charset", function() {
    expect(ncss('@charset "utf-8";@charset "utf-8";'))
      .toEqual('@charset "utf-8";');
  });

  it("should shorten IE opacity filter syntax", function() {
    expect(ncss('.classname { -ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=80)"; /* IE 8 */ }'))
      .toEqual('.classname{-ms-filter:"alpha(opacity=80)"}');
    expect(ncss('.classname {filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=80); } /* IE < 8 */'))
      .toEqual('.classname{filter:alpha(opacity=80)}');
  });

  it("should shorten none", function() {
    expect(ncss(".short {border: none;background: none;outline: none;}"))
      .toEqual(".short{border:0;background:0;outline:0}");
  });

  it("should allow the underscore/star hacks", function() {
    expect(ncss("#hack {hack: 0;*hack: 0;_hack: 0;}"))
      .toEqual("#hack{hack:0;*hack:0;_hack:0}");
  });

  it("should allow the box model hack", function() {
    expect(ncss('#elem {width: 100px; /* IE */voice-family: "\\"}\\"";voice-family:inherit;width: 200px; /* others */}\nhtml>body #elem {width: 200px; /* others */}'))
      .toEqual('#elem{width:100px;voice-family:"\\"}\\"";voice-family:inherit;width:200px}html>body #elem{width:200px}');
  });

  it("should not remove the child selector hack", function() {
    expect(ncss("html >/**/ body p {color: blue;}"))
      .toEqual("html>/**/body p{color:blue}");
  });

  it("should keep the IE5/Mac hack", function() {
    expect(ncss("/* Ignore the next rule in IE mac \\*/\n.selector { color: khaki; } /* Stop ignoring in IE mac */"))
      .toEqual("/*\\*/.selector{color:khaki}/**/");
  });

  it("should handle media queries", function() {
    expect(ncss("@media screen and (min-width: 1024px) { .container { width: 960px; } }"))
      .toEqual("@media screen and (min-width:1024px){.container{width:960px}}");
    expect(ncss("@media screen and (max-width: 699px) and (min-width: 520px){ body { background: #ccc } }"))
      .toEqual("@media screen and (max-width:699px) and (min-width:520px){body{background:#ccc}}");
  });

  it("should not lower case on rules in media blocks", function() {
    expect(ncss("@media screen { #FeedbackMailForm{ PADDING: 0;}}"))
      .toEqual("@media screen{#FeedbackMailForm{padding:0}}");
  });

  it("should handle adjacent selector", function() {
    expect(ncss("#menu a+a { color: blue; }"))
      .toEqual("#menu a+a{color:blue}");
  });

  it("shouldn't care about unnecessary spaces", function() {
    expect(ncss("#menu a{color:blue}"))
      .toEqual("#menu a{color:blue}");
  });

});

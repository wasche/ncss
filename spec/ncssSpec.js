var ncss = require('../lib/ncss');

describe("test minification", function() {

  it("should remove trailing semicolons", function() {
    expect(ncss(".class {padding:2px 2pt;}")).toEqual(".class{padding:2px 2pt}");
  });

  it("should delete comments", function() {
    expect(ncss("/*****\
  Multi-line comment\
  before a new class name\
****/\
.classname {\
  /* comment in declaration block */\
  font-weight: normal;\
}")).toEqual(".classname{font-weight:normal}");
  });

  it('should remove extra semicolons', function() {
    expect(ncss(".noextrasemicolons {border-top: 1px; ;border-bottom: 2px;;;}"))
      .toEqual(".noextrasemicolons{border-top:1px;border-bottom:2px}");
  });

  it("should remove empty rules", function() {
    expect(ncss(".empty { ;}")).toEqual("");
    expect(ncss("#id empty {}")).toEqual("");
  });

  it("should remove units from 0", function() {
    expect(ncss("pre{margin:0pt}")).toEqual("pre{margin:0}");
    expect(ncss("pre{margin:0pt 0px}")).toEqual("pre{margin:0}");
    expect(ncss("a {margin: 0px 0pt 0em 0%;background-position: 0 0ex;padding: 0in 0cm 0mm 0pc}"))
      .toEqual("a{margin:0;background-position:0 0;padding:0}");
    expect(ncss("#id pre {margin: 0 0px;padding: 0pt 0 0;}")).toEqual("#id pre{margin:0;padding:0}");
  });

  it("should drop the leading 0 for floats < 1", function() {
    expect(ncss(".float {margin: 0.6px 0.333pt 1.2em;}")).toEqual(".float{margin:.6px .333pt 1.2em}");
  });

});

"use strict";
(function(module) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], function(exports)  {
            module(exports);
        });
    } else if (typeof exports === 'object' && exports !== null && typeof exports.nodeName !== 'string') {
        module(exports);
    } else {
        module(typeof self !== 'undefined' ? self : this);
}
}(function($rt_exports) {
let $rt_seed = 2463534242,
$rt_nextId = () => {
    let x = $rt_seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    $rt_seed = x;
    return x;
},
$rt_wrapFunction0 = f => function() {
    return f(this);
},
$rt_wrapFunction1 = f => function(p1) {
    return f(this, p1);
},
$rt_wrapFunction2 = f => function(p1, p2) {
    return f(this, p1, p2);
},
$rt_wrapFunction3 = f => function(p1, p2, p3) {
    return f(this, p1, p2, p3);
},
$rt_mainStarter = f => (args, callback) => {
    if (!args) {
        args = [];
    }
    let javaArgs = $rt_createArray($rt_objcls(), args.length);
    for (let i = 0;i < args.length;++i) {
        javaArgs.data[i] = $rt_str(args[i]);
    }
    $rt_startThread(() => {
        f.call(null, javaArgs);
    }, callback);
},
$rt_eraseClinit = target => target.$clinit = () => {
},
$dbg_class = obj => {
    let cls = obj.constructor;
    let arrayDegree = 0;
    while (cls[$rt_meta] && cls[$rt_meta].item) {
        ++arrayDegree;
        cls = cls[$rt_meta].item;
    }
    let clsName = "";
    if (cls[$rt_meta].primitiveKind !== 0) {
        clsName = cls[$rt_meta].name;
    } else {
        clsName = cls[$rt_meta] ? cls[$rt_meta].name || "a/" + cls.name : "@" + cls.name;
    }
    while (arrayDegree-- > 0) {
        clsName += "[]";
    }
    return clsName;
},
$rt_classWithoutFields = superclass => {
    if (superclass === 0) {
        return function() {
        };
    }
    if (superclass === void 0) {
        superclass = $rt_objcls();
    }
    return function() {
        superclass.call(this);
    };
},
$rt_meta = Symbol("teavm_meta"),
$rt_cls = cls => {
    if (cls[$rt_meta].classObject === null) {
        cls[$rt_meta].classObject = jl_Class_createClass(cls);
    }
    return cls[$rt_meta].classObject;
},
$rt_objcls = () => jl_Object,
$rt_newClassMetadata = source => {
    return Object.assign({ name : null, binaryName : null, parent : null, superinterfaces : [], modifiers : 0, primitiveKind : 0, itemType : null, arrayType : null, enclosingClass : null, declaringClass : null, simpleName : null, clinit : () => {
    }, constructor : null, enumConstants : () => null, resolvedEnumConstants : null, reflection : null, classObject : null, assignableCache : null, valueToObject : o => o, objectToValue : o => o }, source || {  });
},
$rt_createPrimitiveCls = (name, binaryName, kind, config) => {
    let cls = () => {
    };
    let meta = $rt_newClassMetadata({ name : name, binaryName : binaryName, modifiers : 1 | 1 << 4, primitiveKind : kind });
    cls[$rt_meta] = meta;
    if (typeof config === 'function') {
        config(meta);
    }
    return cls;
},
$rt_charcls = $rt_createPrimitiveCls("char", "C", 4, meta => {
}),
$rt_intcls = $rt_createPrimitiveCls("int", "I", 5, meta => {
}),
$rt_imul = Math.imul || function(a, b) {
    let ah = a >>> 16 & 0xFFFF;
    let al = a & 0xFFFF;
    let bh = b >>> 16 & 0xFFFF;
    let bl = b & 0xFFFF;
    return al * bl + (ah * bl + al * bh << 16 >>> 0) | 0;
},
$rt_udiv = (a, b) => (a >>> 0) / (b >>> 0) >>> 0,
$rt_umod = (a, b) => (a >>> 0) % (b >>> 0) >>> 0,
$rt_ucmp = (a, b) => {
    a >>>= 0;
    b >>>= 0;
    return a < b ?  -1 : a > b ? 1 : 0;
},
$rt_createArray = (cls, sz) => {
    let data = new Array(sz);
    data.fill(null);
    return new ($rt_arraycls(cls))(data);
},
$rt_createCharArray = sz => new $rt_charArrayCls(new Uint16Array(sz)),
$rt_createIntArray = sz => new $rt_intArrayCls(new Int32Array(sz)),
$rt_arraycls = cls => {
    let result = cls[$rt_meta].arrayType;
    if (result === null) {
        function JavaArray(data) {
            ($rt_objcls()).call(this);
            this.data = data;
        }
        JavaArray.prototype = Object.create(($rt_objcls()).prototype);
        JavaArray.prototype.type = cls;
        JavaArray.prototype.constructor = JavaArray;
        JavaArray.prototype.toString = function() {
            let str = "[";
            for (let i = 0;i < this.data.length;++i) {
                if (i > 0) {
                    str += ", ";
                }
                str += this.data[i].toString();
            }
            str += "]";
            return str;
        };
        JavaArray.prototype.$clone = function() {
            let dataCopy;
            if ('slice' in this.data) {
                dataCopy = this.data.slice();
            } else {
                dataCopy = new this.data.constructor(this.data.length);
                for (let i = 0;i < dataCopy.length;++i) {
                    dataCopy[i] = this.data[i];
                }
            }
            return new ($rt_arraycls(this.type))(dataCopy);
        };
        let name = "[" + cls[$rt_meta].binaryName;
        JavaArray[$rt_meta] = $rt_newClassMetadata({ name : name, binaryName : name, parent : $rt_objcls(), itemType : cls });
        result = JavaArray;
        cls[$rt_meta].arrayType = JavaArray;
    }
    return result;
};
function $rt_arrayLength(array) {
    return array.data.length;
}
let $rt_stringPool_instance,
$rt_stringPool = strings => {
    $rt_stringClassInit();
    $rt_stringPool_instance = new Array(strings.length);
    for (let i = 0;i < strings.length;++i) {
        $rt_stringPool_instance[i] = $rt_intern($rt_str(strings[i]));
    }
},
$rt_s = index => $rt_stringPool_instance[index],
$rt_charArrayToString = (array, offset, count) => {
    let result = "";
    let limit = offset + count;
    for (let i = offset;i < limit;i = i + 1024 | 0) {
        let next = Math.min(limit, i + 1024 | 0);
        result += String.fromCharCode.apply(null, array.subarray(i, next));
    }
    return result;
},
$rt_str = str => str === null ? null : jl_String__init_5(str),
$rt_ustr = str => str === null ? null : str.$nativeString,
$rt_stringClassInit = () => jl_String_$callClinit(),
$rt_intern;
{
    $rt_intern = str => str;
}
let $rt_throw = ex => {
    throw $rt_exception(ex);
},
$rt_javaExceptionProp = Symbol("javaException"),
$rt_exception = ex => {
    if (!ex.$jsException) {
        $rt_fillNativeException(ex);
    }
    return ex.$jsException;
},
$rt_fillNativeException = ex => {
    let javaCause = $rt_throwableCause(ex);
    let jsCause = javaCause !== null ? javaCause.$jsException : void 0;
    let cause = typeof jsCause === "object" ? { cause : jsCause } : void 0;
    let err = new JavaError("Java exception thrown", cause);
    if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(err);
    }
    err[$rt_javaExceptionProp] = ex;
    ex.$jsException = err;
    $rt_fillStack(err, ex);
},
$rt_fillStack = (err, ex) => {
    if (typeof $rt_decodeStack === "function" && err.stack) {
        let stack = $rt_decodeStack(err.stack);
        let javaStack = $rt_createArray($rt_stecls(), stack.length);
        let elem;
        let noStack = false;
        for (let i = 0;i < stack.length;++i) {
            let element = stack[i];
            elem = $rt_createStackElement($rt_str(element.className), $rt_str(element.methodName), $rt_str(element.fileName), element.lineNumber);
            if (elem == null) {
                noStack = true;
                break;
            }
            javaStack.data[i] = elem;
        }
        if (!noStack) {
            $rt_setStack(ex, javaStack);
        }
    }
},
JavaError;
if (typeof Reflect === 'object') {
    let defaultMessage = Symbol("defaultMessage");
    JavaError = function JavaError(message, cause) {
        let self = Reflect.construct(Error, [void 0, cause], JavaError);
        Object.setPrototypeOf(self, JavaError.prototype);
        self[defaultMessage] = message;
        return self;
    }
    ;
    JavaError.prototype = Object.create(Error.prototype, { constructor : { configurable : true, writable : true, value : JavaError }, message : { get() {
        try {
            let javaException = this[$rt_javaExceptionProp];
            if (typeof javaException === 'object') {
                let javaMessage = $rt_throwableMessage(javaException);
                if (typeof javaMessage === "object") {
                    return javaMessage !== null ? javaMessage.toString() : null;
                }
            }
            return this[defaultMessage];
        } catch (e){
            return "Exception occurred trying to extract Java exception message: " + e;
        }
    } } });
} else {
    JavaError = Error;
}
let $rt_javaException = e => e instanceof Error && typeof e[$rt_javaExceptionProp] === 'object' ? e[$rt_javaExceptionProp] : null,
$rt_throwableMessage = t => jl_Throwable_getMessage(t),
$rt_throwableCause = t => jl_Throwable_getCause(t),
$rt_stecls = () => $rt_objcls(),
$rt_createStackElement = (className, methodName, fileName, lineNumber) => {
    {
        return null;
    }
},
$rt_setStack = (e, stack) => {
},
$rt_createOutputFunction = outputFunction => {
    let buffer = "";
    return msg => {
        let index = 0;
        while (true) {
            let next = msg.indexOf('\n', index);
            if (next < 0) {
                break;
            }
            outputFunction(buffer + msg.substring(index, next));
            buffer = "";
            index = next + 1;
        }
        buffer += msg.substring(index);
    };
},
$rt_putStdout = typeof $rt_putStdoutCustom === "function" ? $rt_putStdoutCustom : typeof console === "object" ? $rt_createOutputFunction(msg => console.info(msg)) : () => {
},
$rt_putStderr = typeof $rt_putStderrCustom === "function" ? $rt_putStderrCustom : typeof console === "object" ? $rt_createOutputFunction(msg => console.error(msg)) : () => {
},
$rt_packageData = null,
$rt_packages = data => {
    let i = 0;
    let packages = new Array(data.length);
    for (let j = 0;j < data.length;++j) {
        let prefixIndex = data[i++];
        let prefix = prefixIndex >= 0 ? packages[prefixIndex] : "";
        packages[j] = prefix + data[i++] + ".";
    }
    $rt_packageData = packages;
},
$rt_allClasses = [],
$rt_metadata = data => {
    let packages = $rt_packageData;
    let i = 0;
    while (i < data.length) {
        let cls = data[i++];
        $rt_allClasses.push(cls);
        let m = $rt_newClassMetadata();
        cls[$rt_meta] = m;
        let className = data[i++];
        m.name = className !== 0 ? className : null;
        if (m.name !== null) {
            let packageIndex = data[i++];
            if (packageIndex >= 0) {
                m.name = packages[packageIndex] + m.name;
            }
        }
        m.binaryName = "L" + m.name + ";";
        let superclass = data[i++];
        m.parent = superclass !== 0 ? superclass : null;
        m.superinterfaces = data[i++];
        if (m.parent) {
            cls.prototype = Object.create(m.parent.prototype);
        } else {
            cls.prototype = {  };
        }
        cls.prototype.constructor = cls;
        m.modifiers = data[i++];
        m.primitiveKind = 0;
        let innerClassInfo = data[i++];
        if (innerClassInfo !== 0) {
            let enclosingClass = innerClassInfo[0];
            m.enclosingClass = enclosingClass !== 0 ? enclosingClass : null;
            let declaringClass = innerClassInfo[1];
            m.declaringClass = declaringClass !== 0 ? declaringClass : null;
            let simpleName = innerClassInfo[2];
            m.simpleName = simpleName !== 0 ? simpleName : null;
        }
        let clinit = data[i++];
        m.clinit = clinit !== 0 ? () => {
            m.clinit = () => {
            };
            clinit();
        } : () => {
        };
        let virtualMethods = data[i++];
        if (virtualMethods !== 0) {
            for (let j = 0;j < virtualMethods.length;j += 2) {
                let name = virtualMethods[j];
                let func = virtualMethods[j + 1];
                if (typeof name === 'string') {
                    name = [name];
                }
                for (let k = 0;k < name.length;++k) {
                    cls.prototype[name[k]] = func;
                }
            }
        }
    }
},
$rt_startThread = (runner, callback) => {
    let result;
    try {
        result = runner();
    } catch (e){
        result = e;
    }
    if (typeof callback !== 'undefined') {
        callback(result);
    } else if (result instanceof Error) {
        throw result;
    }
};
function jl_Object() {
    this.$id$ = 0;
}
let jl_Object__init_ = $this => {
    return;
},
jl_Object__init_0 = () => {
    let var_0 = new jl_Object();
    jl_Object__init_(var_0);
    return var_0;
},
jl_Object_getClass = $this => {
    return $rt_cls(jl_Object_getClassInfo($this));
},
jl_Object_getClassInfo = var$0 => {
    return var$0.constructor;
},
jl_Object_toString = var$0 => {
    let var$1, var$2, var$3;
    var$1 = jl_Class_getName(jl_Object_getClass(var$0));
    var$2 = jl_Integer_toHexString(jl_Object_identity(var$0));
    var$3 = jl_StringBuilder__init_();
    jl_StringBuilder_append(jl_StringBuilder_append0(jl_StringBuilder_append(var$3, var$1), 64), var$2);
    return jl_StringBuilder_toString(var$3);
},
jl_Object_identity = $this => {
    let $platformThis;
    $platformThis = $this;
    if (!$platformThis.$id$)
        $platformThis.$id$ = $rt_nextId();
    return $this.$id$;
};
function jl_Throwable() {
    let a = this; jl_Object.call(a);
    a.$message = null;
    a.$cause = null;
    a.$suppressionEnabled = 0;
    a.$writableStackTrace = 0;
}
let jl_Throwable__init_ = $this => {
    jl_Throwable_initNativeException($this);
    $this.$suppressionEnabled = 1;
    $this.$writableStackTrace = 1;
    $this.$fillInStackTrace();
},
jl_Throwable__init_1 = () => {
    let var_0 = new jl_Throwable();
    jl_Throwable__init_(var_0);
    return var_0;
},
jl_Throwable__init_0 = ($this, $message) => {
    jl_Throwable_initNativeException($this);
    $this.$suppressionEnabled = 1;
    $this.$writableStackTrace = 1;
    $this.$fillInStackTrace();
    $this.$message = $message;
},
jl_Throwable__init_2 = var_0 => {
    let var_1 = new jl_Throwable();
    jl_Throwable__init_0(var_1, var_0);
    return var_1;
},
jl_Throwable_fillInStackTrace = $this => {
    return $this;
},
jl_Throwable_initNativeException = $this => {
    $rt_fillNativeException($this);
},
jl_Throwable_getMessage = $this => {
    return $this.$message;
},
jl_Throwable_getLocalizedMessage = $this => {
    return $this.$getMessage();
},
jl_Throwable_getCause = $this => {
    return $this.$cause === $this ? null : $this.$cause;
},
jl_Throwable_toString = $this => {
    let $message, var$2, var$3, var$4;
    $message = $this.$getLocalizedMessage();
    var$2 = jl_Class_getName(jl_Object_getClass($this));
    if ($message === null)
        var$3 = $rt_s(0);
    else {
        var$3 = jl_StringBuilder__init_();
        jl_StringBuilder_append(jl_StringBuilder_append(var$3, $rt_s(1)), $message);
        var$3 = jl_StringBuilder_toString(var$3);
    }
    var$4 = jl_StringBuilder__init_();
    jl_StringBuilder_append(jl_StringBuilder_append(var$4, var$2), var$3);
    return jl_StringBuilder_toString(var$4);
},
otvf_RecursiveFactorial = $rt_classWithoutFields(),
otvf_RecursiveFactorial_$callClinit = () => {
    otvf_RecursiveFactorial_$callClinit = $rt_eraseClinit(otvf_RecursiveFactorial);
    otvf_RecursiveFactorial__clinit_();
},
otvf_RecursiveFactorial_factorial = $n => {
    let var$2;
    otvf_RecursiveFactorial_$callClinit();
    otv_StepRecorder_enterMethod($rt_s(2), $rt_s(3));
    otv_StepRecorder_step($rt_s(2), $rt_s(3), 28);
    otv_StepRecorder_captureVar($rt_s(4), $n);
    if ($n <= 1) {
        otv_StepRecorder_step($rt_s(2), $rt_s(3), 29);
        otv_StepRecorder_captureVar($rt_s(4), $n);
        otv_StepRecorder_exitMethod();
        return 1;
    }
    otv_StepRecorder_step($rt_s(2), $rt_s(3), 31);
    otv_StepRecorder_captureVar($rt_s(4), $n);
    var$2 = $rt_imul($n, otvf_RecursiveFactorial_factorial($n - 1 | 0));
    otv_StepRecorder_exitMethod();
    return var$2;
},
otvf_RecursiveFactorial_main = $args => {
    otvf_RecursiveFactorial_$callClinit();
    otv_StepRecorder_enterMethod($rt_s(2), $rt_s(5));
    otv_StepRecorder_step($rt_s(2), $rt_s(5), 35);
    otv_StepRecorder_captureVar0($rt_s(6), $args);
    (jl_System_out()).$println(otvf_RecursiveFactorial_factorial(4));
    otv_StepRecorder_exitMethod();
},
otvf_RecursiveFactorial__clinit_ = () => {
    return;
},
jl_Exception = $rt_classWithoutFields(jl_Throwable),
jl_Exception__init_0 = $this => {
    jl_Throwable__init_($this);
},
jl_Exception__init_1 = () => {
    let var_0 = new jl_Exception();
    jl_Exception__init_0(var_0);
    return var_0;
},
jl_Exception__init_ = ($this, $message) => {
    jl_Throwable__init_0($this, $message);
},
jl_Exception__init_2 = var_0 => {
    let var_1 = new jl_Exception();
    jl_Exception__init_(var_1, var_0);
    return var_1;
},
jl_RuntimeException = $rt_classWithoutFields(jl_Exception),
jl_RuntimeException__init_ = $this => {
    jl_Exception__init_0($this);
},
jl_RuntimeException__init_1 = () => {
    let var_0 = new jl_RuntimeException();
    jl_RuntimeException__init_(var_0);
    return var_0;
},
jl_RuntimeException__init_0 = ($this, $message) => {
    jl_Exception__init_($this, $message);
},
jl_RuntimeException__init_2 = var_0 => {
    let var_1 = new jl_RuntimeException();
    jl_RuntimeException__init_0(var_1, var_0);
    return var_1;
},
jl_IndexOutOfBoundsException = $rt_classWithoutFields(jl_RuntimeException),
jl_IndexOutOfBoundsException__init_ = $this => {
    jl_RuntimeException__init_($this);
},
jl_IndexOutOfBoundsException__init_0 = () => {
    let var_0 = new jl_IndexOutOfBoundsException();
    jl_IndexOutOfBoundsException__init_(var_0);
    return var_0;
},
ju_Arrays = $rt_classWithoutFields(),
ju_Arrays_copyOf = ($array, $length) => {
    let var$3, $result, $sz, $i;
    var$3 = $array.data;
    $result = $rt_createCharArray($length);
    $sz = jl_Math_min($length, var$3.length);
    $i = 0;
    while ($i < $sz) {
        $result.data[$i] = var$3[$i];
        $i = $i + 1 | 0;
    }
    return $result;
},
jl_Runnable = $rt_classWithoutFields(0),
otcjl_TestObject = $rt_classWithoutFields(),
jl_System = $rt_classWithoutFields(),
jl_System_outCache = null,
jl_System_errCache = null,
jl_System_out = () => {
    if (jl_System_outCache === null)
        jl_System_outCache = otcic_JSStdoutPrintStream__init_0();
    return jl_System_outCache;
},
jl_System_err = () => {
    if (jl_System_errCache === null)
        jl_System_errCache = otcic_JSStderrPrintStream__init_0();
    return jl_System_errCache;
},
jl_AutoCloseable = $rt_classWithoutFields(0),
ji_Closeable = $rt_classWithoutFields(0),
ji_Flushable = $rt_classWithoutFields(0),
ji_OutputStream = $rt_classWithoutFields(),
ji_OutputStream__init_ = $this => {
    jl_Object__init_($this);
};
function ji_FilterOutputStream() {
    ji_OutputStream.call(this);
    this.$out0 = null;
}
let ji_FilterOutputStream__init_ = ($this, $out) => {
    ji_OutputStream__init_($this);
    $this.$out0 = $out;
},
ji_FilterOutputStream__init_0 = var_0 => {
    let var_1 = new ji_FilterOutputStream();
    ji_FilterOutputStream__init_(var_1, var_0);
    return var_1;
},
jl_Appendable = $rt_classWithoutFields(0);
function ji_PrintStream() {
    let a = this; ji_FilterOutputStream.call(a);
    a.$autoFlush = 0;
    a.$sb = null;
    a.$buffer0 = null;
    a.$charset = null;
}
let ji_PrintStream__init_ = ($this, $out, $autoFlush, $charset) => {
    ji_FilterOutputStream__init_($this, $out);
    $this.$sb = jl_StringBuilder__init_();
    $this.$buffer0 = $rt_createCharArray(32);
    $this.$autoFlush = $autoFlush;
    $this.$charset = $charset;
},
ji_PrintStream__init_0 = (var_0, var_1, var_2) => {
    let var_3 = new ji_PrintStream();
    ji_PrintStream__init_(var_3, var_0, var_1, var_2);
    return var_3;
},
otcic_JsConsolePrintStream = $rt_classWithoutFields(ji_PrintStream),
otcic_JsConsolePrintStream__init_ = $this => {
    ji_PrintStream__init_($this, null, 0, null);
},
otcic_JsConsolePrintStream_println = ($this, $s) => {
    $this.$print($s);
    $this.$print($rt_s(7));
},
otcic_JsConsolePrintStream_println0 = ($this, $i) => {
    $this.$println0(jl_Integer_toString($i));
},
otcic_JSStdoutPrintStream = $rt_classWithoutFields(otcic_JsConsolePrintStream),
otcic_JSStdoutPrintStream__init_ = $this => {
    otcic_JsConsolePrintStream__init_($this);
},
otcic_JSStdoutPrintStream__init_0 = () => {
    let var_0 = new otcic_JSStdoutPrintStream();
    otcic_JSStdoutPrintStream__init_(var_0);
    return var_0;
},
otcic_JSStdoutPrintStream_print = ($this, $s) => {
    if ($s === null)
        $s = $rt_s(8);
    $rt_putStdout($rt_ustr($s));
},
ji_Serializable = $rt_classWithoutFields(0),
jl_Number = $rt_classWithoutFields(),
jl_Comparable = $rt_classWithoutFields(0),
jl_Integer = $rt_classWithoutFields(jl_Number),
jl_Integer_TYPE = null,
jl_Integer_$callClinit = () => {
    jl_Integer_$callClinit = $rt_eraseClinit(jl_Integer);
    jl_Integer__clinit_();
},
jl_Integer_toString0 = ($i, $radix) => {
    jl_Integer_$callClinit();
    if (!($radix >= 2 && $radix <= 36))
        $radix = 10;
    return ((jl_AbstractStringBuilder__init_3(20)).$append1($i, $radix)).$toString();
},
jl_Integer_toHexString = $i => {
    jl_Integer_$callClinit();
    return otci_IntegerUtil_toUnsignedLogRadixString($i, 4);
},
jl_Integer_toString = $i => {
    jl_Integer_$callClinit();
    return jl_Integer_toString0($i, 10);
},
jl_Integer_numberOfLeadingZeros = $i => {
    let $n, var$3, var$4;
    jl_Integer_$callClinit();
    if (!$i)
        return 32;
    $n = 0;
    var$3 = $i >>> 16 | 0;
    if (var$3)
        $n = 16;
    else
        var$3 = $i;
    var$4 = var$3 >>> 8 | 0;
    if (!var$4)
        var$4 = var$3;
    else
        $n = $n | 8;
    var$3 = var$4 >>> 4 | 0;
    if (!var$3)
        var$3 = var$4;
    else
        $n = $n | 4;
    var$4 = var$3 >>> 2 | 0;
    if (!var$4)
        var$4 = var$3;
    else
        $n = $n | 2;
    if (var$4 >>> 1 | 0)
        $n = $n | 1;
    return (32 - $n | 0) - 1 | 0;
},
jl_Integer__clinit_ = () => {
    jl_Integer_TYPE = $rt_cls($rt_intcls);
},
jl_ClassCastException = $rt_classWithoutFields(jl_RuntimeException),
otji_JSWrapper = $rt_classWithoutFields(),
otp_Platform = $rt_classWithoutFields(),
jl_Character = $rt_classWithoutFields(),
jl_Character_TYPE = null,
jl_Character_characterCache = null,
jl_Character_$callClinit = () => {
    jl_Character_$callClinit = $rt_eraseClinit(jl_Character);
    jl_Character__clinit_();
},
jl_Character_forDigit = ($digit, $radix) => {
    jl_Character_$callClinit();
    if ($radix >= 2 && $radix <= 36 && $digit >= 0 && $digit < $radix)
        return $digit < 10 ? (48 + $digit | 0) & 65535 : ((97 + $digit | 0) - 10 | 0) & 65535;
    return 0;
},
jl_Character__clinit_ = () => {
    jl_Character_TYPE = $rt_cls($rt_charcls);
    jl_Character_characterCache = $rt_createArray(jl_Character, 128);
},
jnc_Charset = $rt_classWithoutFields(),
otci_IntegerUtil = $rt_classWithoutFields(),
otci_IntegerUtil_toUnsignedLogRadixString = ($value, $radixLog2) => {
    let $radix, $mask, $sz, $chars, $pos, $target, var$9, $target_0;
    if (!$value)
        return $rt_s(9);
    $radix = 1 << $radixLog2;
    $mask = $radix - 1 | 0;
    $sz = (((32 - jl_Integer_numberOfLeadingZeros($value) | 0) + $radixLog2 | 0) - 1 | 0) / $radixLog2 | 0;
    $chars = $rt_createCharArray($sz);
    $pos = $rt_imul($sz - 1 | 0, $radixLog2);
    $target = 0;
    while ($pos >= 0) {
        var$9 = $chars.data;
        $target_0 = $target + 1 | 0;
        var$9[$target] = jl_Character_forDigit(($value >>> $pos | 0) & $mask, $radix);
        $pos = $pos - $radixLog2 | 0;
        $target = $target_0;
    }
    return jl_String__init_4($chars);
},
jl_CharSequence = $rt_classWithoutFields(0);
function jl_AbstractStringBuilder() {
    let a = this; jl_Object.call(a);
    a.$buffer = null;
    a.$length0 = 0;
}
let jl_AbstractStringBuilder__init_0 = $this => {
    jl_AbstractStringBuilder__init_($this, 16);
},
jl_AbstractStringBuilder__init_6 = () => {
    let var_0 = new jl_AbstractStringBuilder();
    jl_AbstractStringBuilder__init_0(var_0);
    return var_0;
},
jl_AbstractStringBuilder__init_ = ($this, $capacity) => {
    jl_Object__init_($this);
    $this.$buffer = $rt_createCharArray($capacity);
},
jl_AbstractStringBuilder__init_3 = var_0 => {
    let var_1 = new jl_AbstractStringBuilder();
    jl_AbstractStringBuilder__init_(var_1, var_0);
    return var_1;
},
jl_AbstractStringBuilder__init_2 = ($this, $value) => {
    jl_AbstractStringBuilder__init_1($this, $value);
},
jl_AbstractStringBuilder__init_4 = var_0 => {
    let var_1 = new jl_AbstractStringBuilder();
    jl_AbstractStringBuilder__init_2(var_1, var_0);
    return var_1;
},
jl_AbstractStringBuilder__init_1 = ($this, $value) => {
    let $i;
    jl_Object__init_($this);
    $this.$buffer = $rt_createCharArray($value.$length());
    $i = 0;
    while ($i < $this.$buffer.data.length) {
        $this.$buffer.data[$i] = $value.$charAt($i);
        $i = $i + 1 | 0;
    }
    $this.$length0 = $value.$length();
},
jl_AbstractStringBuilder__init_5 = var_0 => {
    let var_1 = new jl_AbstractStringBuilder();
    jl_AbstractStringBuilder__init_1(var_1, var_0);
    return var_1;
},
jl_AbstractStringBuilder_append2 = ($this, $obj) => {
    return $this.$insert($this.$length0, $obj);
},
jl_AbstractStringBuilder_append = ($this, $string) => {
    return $this.$insert0($this.$length0, $string);
},
jl_AbstractStringBuilder_insert = ($this, $index, $string) => {
    let $i, var$4, var$5;
    if ($index >= 0 && $index <= $this.$length0) {
        if ($string === null)
            $string = $rt_s(8);
        else if ($string.$isEmpty())
            return $this;
        $this.$ensureCapacity($this.$length0 + $string.$length() | 0);
        $i = $this.$length0 - 1 | 0;
        while ($i >= $index) {
            $this.$buffer.data[$i + $string.$length() | 0] = $this.$buffer.data[$i];
            $i = $i + (-1) | 0;
        }
        $this.$length0 = $this.$length0 + $string.$length() | 0;
        $i = 0;
        while ($i < $string.$length()) {
            var$4 = $this.$buffer.data;
            var$5 = $index + 1 | 0;
            var$4[$index] = $string.$charAt($i);
            $i = $i + 1 | 0;
            $index = var$5;
        }
        return $this;
    }
    $rt_throw(jl_StringIndexOutOfBoundsException__init_());
},
jl_AbstractStringBuilder_append1 = ($this, $value) => {
    return $this.$append1($value, 10);
},
jl_AbstractStringBuilder_append3 = ($this, $value, $radix) => {
    return $this.$insert1($this.$length0, $value, $radix);
},
jl_AbstractStringBuilder_insert2 = ($this, $target, $value, $radix) => {
    let $positive, var$5, var$6, $pos, $sz, $posLimit, var$10, var$11;
    $positive = 1;
    if ($value < 0) {
        $positive = 0;
        $value =  -$value | 0;
    }
    a: {
        if ($rt_ucmp($value, $radix) < 0) {
            if ($positive)
                jl_AbstractStringBuilder_insertSpace($this, $target, $target + 1 | 0);
            else {
                jl_AbstractStringBuilder_insertSpace($this, $target, $target + 2 | 0);
                var$5 = $this.$buffer.data;
                var$6 = $target + 1 | 0;
                var$5[$target] = 45;
                $target = var$6;
            }
            $this.$buffer.data[$target] = jl_Character_forDigit($value, $radix);
        } else {
            $pos = 1;
            $sz = 1;
            $posLimit = $rt_udiv((-1), $radix);
            b: {
                while (true) {
                    var$10 = $rt_imul($pos, $radix);
                    if ($rt_ucmp(var$10, $value) > 0) {
                        var$10 = $pos;
                        break b;
                    }
                    $sz = $sz + 1 | 0;
                    if ($rt_ucmp(var$10, $posLimit) > 0)
                        break;
                    $pos = var$10;
                }
            }
            if (!$positive)
                $sz = $sz + 1 | 0;
            jl_AbstractStringBuilder_insertSpace($this, $target, $target + $sz | 0);
            if ($positive)
                var$11 = $target;
            else {
                var$5 = $this.$buffer.data;
                var$11 = $target + 1 | 0;
                var$5[$target] = 45;
            }
            while (true) {
                if (!var$10)
                    break a;
                var$5 = $this.$buffer.data;
                var$6 = var$11 + 1 | 0;
                var$5[var$11] = jl_Character_forDigit($rt_udiv($value, var$10), $radix);
                $value = $rt_umod($value, var$10);
                var$10 = $rt_udiv(var$10, $radix);
                var$11 = var$6;
            }
        }
    }
    return $this;
},
jl_AbstractStringBuilder_append0 = ($this, $c) => {
    return $this.$insert2($this.$length0, $c);
},
jl_AbstractStringBuilder_insert1 = ($this, $index, $c) => {
    jl_AbstractStringBuilder_insertSpace($this, $index, $index + 1 | 0);
    $this.$buffer.data[$index] = $c;
    return $this;
},
jl_AbstractStringBuilder_insert0 = ($this, $index, $obj) => {
    return $this.$insert0($index, $obj === null ? $rt_s(8) : $obj.$toString());
},
jl_AbstractStringBuilder_ensureCapacity = ($this, $capacity) => {
    let $newLength;
    if ($this.$buffer.data.length >= $capacity)
        return;
    $newLength = $this.$buffer.data.length >= 1073741823 ? 2147483647 : jl_Math_max($capacity, jl_Math_max($this.$buffer.data.length * 2 | 0, 5));
    $this.$buffer = ju_Arrays_copyOf($this.$buffer, $newLength);
},
jl_AbstractStringBuilder_toString = $this => {
    return jl_String__init_3($this.$buffer, 0, $this.$length0);
},
jl_AbstractStringBuilder_length = $this => {
    return $this.$length0;
},
jl_AbstractStringBuilder_charAt = ($this, $index) => {
    if ($index >= 0 && $index < $this.$length0)
        return $this.$buffer.data[$index];
    $rt_throw(jl_IndexOutOfBoundsException__init_0());
},
jl_AbstractStringBuilder_insertSpace = ($this, $start, $end) => {
    let $sz, $i;
    $sz = $this.$length0 - $start | 0;
    $this.$ensureCapacity(($this.$length0 + $end | 0) - $start | 0);
    $i = $sz - 1 | 0;
    while ($i >= 0) {
        $this.$buffer.data[$end + $i | 0] = $this.$buffer.data[$start + $i | 0];
        $i = $i + (-1) | 0;
    }
    $this.$length0 = $this.$length0 + ($end - $start | 0) | 0;
},
otrr_ReflectionInfo = $rt_classWithoutFields(),
otr_StringInfo = $rt_classWithoutFields(otrr_ReflectionInfo),
jl_Math = $rt_classWithoutFields(),
jl_Math_min = ($a, $b) => {
    if ($a < $b)
        $b = $a;
    return $b;
},
jl_Math_max = ($a, $b) => {
    if ($a > $b)
        $b = $a;
    return $b;
},
jl_String = $rt_classWithoutFields(),
jl_String_EMPTY_CHARS = null,
jl_String_EMPTY = null,
jl_String_CASE_INSENSITIVE_ORDER = null,
jl_String_$callClinit = () => {
    jl_String_$callClinit = $rt_eraseClinit(jl_String);
    jl_String__clinit_();
},
jl_String__init_1 = $this => {
    jl_String_$callClinit();
    jl_Object__init_($this);
    $this.$nativeString = "";
},
jl_String__init_6 = () => {
    let var_0 = new jl_String();
    jl_String__init_1(var_0);
    return var_0;
},
jl_String__init_ = ($this, $characters) => {
    let var$2;
    jl_String_$callClinit();
    var$2 = $characters.data;
    jl_Object__init_($this);
    $this.$nativeString = $rt_charArrayToString($characters.data, 0, var$2.length);
},
jl_String__init_4 = var_0 => {
    let var_1 = new jl_String();
    jl_String__init_(var_1, var_0);
    return var_1;
},
jl_String__init_0 = (var$0, var$1) => {
    var$0.$nativeString = var$1;
},
jl_String__init_5 = var_0 => {
    let var_1 = new jl_String();
    jl_String__init_0(var_1, var_0);
    return var_1;
},
jl_String__init_2 = (var$0, var$1, $offset, $count) => {
    let var$4;
    jl_String_$callClinit();
    var$4 = var$1.data;
    jl_Object__init_(var$0);
    ju_Objects_checkFromIndexSize($offset, $count, var$4.length);
    var$0.$nativeString = $rt_charArrayToString(var$1.data, $offset, $count);
},
jl_String__init_3 = (var_0, var_1, var_2) => {
    let var_3 = new jl_String();
    jl_String__init_2(var_3, var_0, var_1, var_2);
    return var_3;
},
jl_String_charAt = ($this, $index) => {
    if ($index >= 0 && $index < $this.$nativeString.length)
        return $this.$nativeString.charCodeAt($index);
    $rt_throw(jl_StringIndexOutOfBoundsException__init_());
},
jl_String_length = $this => {
    return $this.$nativeString.length;
},
jl_String_isEmpty = $this => {
    return $this.$nativeString.length ? 0 : 1;
},
jl_String_toString = $this => {
    return $this;
},
jl_String_valueOf = $i => {
    jl_String_$callClinit();
    return ((jl_StringBuilder__init_()).$append2($i)).$toString();
},
jl_String__clinit_ = () => {
    jl_String_EMPTY_CHARS = $rt_createCharArray(0);
    jl_String_EMPTY = jl_String__init_6();
    jl_String_CASE_INSENSITIVE_ORDER = jl_String$_clinit_$lambda$_118_0__init_0();
},
jlr_AnnotatedElement = $rt_classWithoutFields(0),
jlr_GenericDeclaration = $rt_classWithoutFields(0),
otcic_JSStderrPrintStream = $rt_classWithoutFields(otcic_JsConsolePrintStream),
otcic_JSStderrPrintStream__init_ = $this => {
    otcic_JsConsolePrintStream__init_($this);
};
let otcic_JSStderrPrintStream__init_0 = () => {
    let var_0 = new otcic_JSStderrPrintStream();
    otcic_JSStderrPrintStream__init_(var_0);
    return var_0;
},
otcic_JSStderrPrintStream_print = ($this, $s) => {
    if ($s === null)
        $s = $rt_s(8);
    $rt_putStderr($rt_ustr($s));
},
otji_JS = $rt_classWithoutFields(),
jl_StringIndexOutOfBoundsException = $rt_classWithoutFields(jl_IndexOutOfBoundsException),
jl_StringIndexOutOfBoundsException__init_0 = $this => {
    jl_IndexOutOfBoundsException__init_($this);
},
jl_StringIndexOutOfBoundsException__init_ = () => {
    let var_0 = new jl_StringIndexOutOfBoundsException();
    jl_StringIndexOutOfBoundsException__init_0(var_0);
    return var_0;
},
otv_StepRecorder = $rt_classWithoutFields(),
otv_StepRecorder_frameClass = null,
otv_StepRecorder_frameMeth = null,
otv_StepRecorder_frameLine = null,
otv_StepRecorder_depth = 0,
otv_StepRecorder_stepCount = 0,
otv_StepRecorder_truncated = 0,
otv_StepRecorder_$callClinit = () => {
    otv_StepRecorder_$callClinit = $rt_eraseClinit(otv_StepRecorder);
    otv_StepRecorder__clinit_();
},
otv_StepRecorder_step = ($className, $methodName, $line) => {
    otv_StepRecorder_$callClinit();
    if (otv_StepRecorder_truncated)
        return;
    if (otv_StepRecorder_stepCount >= 10000) {
        otv_StepRecorder_truncated = 1;
        otv_StepRecorder_jsStepLimitReached();
        return;
    }
    otv_StepRecorder_stepCount = otv_StepRecorder_stepCount + 1 | 0;
    if (otv_StepRecorder_depth > 0)
        otv_StepRecorder_frameLine.data[otv_StepRecorder_depth - 1 | 0] = $line;
    otv_StepRecorder_jsStep($className, $methodName, $line);
},
otv_StepRecorder_enterMethod = ($className, $methodName) => {
    otv_StepRecorder_$callClinit();
    if (!otv_StepRecorder_truncated) {
        if (otv_StepRecorder_depth < 64) {
            otv_StepRecorder_frameClass.data[otv_StepRecorder_depth] = $className;
            otv_StepRecorder_frameMeth.data[otv_StepRecorder_depth] = $methodName;
            otv_StepRecorder_frameLine.data[otv_StepRecorder_depth] = 0;
            otv_StepRecorder_depth = otv_StepRecorder_depth + 1 | 0;
        }
        otv_StepRecorder_jsEnterMethod($className, $methodName);
    }
},
otv_StepRecorder_exitMethod = () => {
    otv_StepRecorder_$callClinit();
    if (!otv_StepRecorder_truncated) {
        otv_StepRecorder_jsExitMethod();
        if (otv_StepRecorder_depth > 0)
            otv_StepRecorder_depth = otv_StepRecorder_depth - 1 | 0;
    }
},
otv_StepRecorder_captureVar0 = ($name, $value) => {
    otv_StepRecorder_$callClinit();
    if (!otv_StepRecorder_truncated)
        otv_StepRecorder_jsCaptureVar($name, $value !== null ? $value.$toString() : $rt_s(8));
},
otv_StepRecorder_captureVar = ($name, $value) => {
    otv_StepRecorder_$callClinit();
    if (!otv_StepRecorder_truncated)
        otv_StepRecorder_jsCaptureVar($name, jl_String_valueOf($value));
},
otv_StepRecorder_jsStep = ($className, $methodName, $line) => {
    let $sb, $i, var$6;
    otv_StepRecorder_$callClinit();
    $sb = jl_StringBuilder__init_2($rt_s(10));
    $i = 0;
    while ($i < otv_StepRecorder_depth) {
        var$6 = ($sb.$append0(58)).$append3(otv_StepRecorder_frameClass.data[$i]);
        var$6 = (var$6.$append0(58)).$append3(otv_StepRecorder_frameMeth.data[$i]);
        (var$6.$append0(58)).$append2(otv_StepRecorder_frameLine.data[$i]);
        $i = $i + 1 | 0;
    }
    (jl_System_err()).$println0($sb.$toString());
},
otv_StepRecorder_jsEnterMethod = ($className, $methodName) => {
    otv_StepRecorder_$callClinit();
},
otv_StepRecorder_jsExitMethod = () => {
    otv_StepRecorder_$callClinit();
},
otv_StepRecorder_jsCaptureVar = ($name, $value) => {
    let var$3, var$4;
    otv_StepRecorder_$callClinit();
    var$3 = jl_System_err();
    var$4 = jl_StringBuilder__init_();
    jl_StringBuilder_append(jl_StringBuilder_append0(jl_StringBuilder_append(jl_StringBuilder_append(var$4, $rt_s(11)), $name), 61), $value);
    var$3.$println0(jl_StringBuilder_toString(var$4));
},
otv_StepRecorder_jsStepLimitReached = () => {
    otv_StepRecorder_$callClinit();
    (jl_System_err()).$println0($rt_s(12));
},
otv_StepRecorder__clinit_ = () => {
    otv_StepRecorder_frameClass = $rt_createArray(jl_String, 64);
    otv_StepRecorder_frameMeth = $rt_createArray(jl_String, 64);
    otv_StepRecorder_frameLine = $rt_createIntArray(64);
},
ju_Objects = $rt_classWithoutFields(),
ju_Objects_checkFromIndexSize = ($fromIndex, $size, $length) => {
    if ($fromIndex >= 0 && $size >= 0 && $size <= ($length - $fromIndex | 0))
        return $fromIndex;
    $rt_throw(jl_IndexOutOfBoundsException__init_0());
},
jlr_Type = $rt_classWithoutFields(0),
otrr_ClassInfo = $rt_classWithoutFields(otrr_ReflectionInfo),
ju_Comparator = $rt_classWithoutFields(0),
jl_String$_clinit_$lambda$_118_0 = $rt_classWithoutFields(),
jl_String$_clinit_$lambda$_118_0__init_ = var$0 => {
    jl_Object__init_(var$0);
},
jl_String$_clinit_$lambda$_118_0__init_0 = () => {
    let var_0 = new jl_String$_clinit_$lambda$_118_0();
    jl_String$_clinit_$lambda$_118_0__init_(var_0);
    return var_0;
},
jl_StringBuilder = $rt_classWithoutFields(jl_AbstractStringBuilder),
jl_StringBuilder__init_1 = $this => {
    jl_AbstractStringBuilder__init_0($this);
},
jl_StringBuilder__init_ = () => {
    let var_0 = new jl_StringBuilder();
    jl_StringBuilder__init_1(var_0);
    return var_0;
},
jl_StringBuilder__init_0 = ($this, $value) => {
    jl_AbstractStringBuilder__init_2($this, $value);
},
jl_StringBuilder__init_2 = var_0 => {
    let var_1 = new jl_StringBuilder();
    jl_StringBuilder__init_0(var_1, var_0);
    return var_1;
},
jl_StringBuilder_append = ($this, $obj) => {
    jl_AbstractStringBuilder_append2($this, $obj);
    return $this;
},
jl_StringBuilder_append2 = ($this, $string) => {
    jl_AbstractStringBuilder_append($this, $string);
    return $this;
},
jl_StringBuilder_append1 = ($this, $value) => {
    jl_AbstractStringBuilder_append1($this, $value);
    return $this;
},
jl_StringBuilder_append0 = ($this, $c) => {
    jl_AbstractStringBuilder_append0($this, $c);
    return $this;
},
jl_StringBuilder_insert = ($this, $index, $obj) => {
    jl_AbstractStringBuilder_insert0($this, $index, $obj);
    return $this;
},
jl_StringBuilder_insert2 = ($this, $index, $c) => {
    jl_AbstractStringBuilder_insert1($this, $index, $c);
    return $this;
},
jl_StringBuilder_insert1 = ($this, $index, $string) => {
    jl_AbstractStringBuilder_insert($this, $index, $string);
    return $this;
},
jl_StringBuilder_charAt = ($this, var$1) => {
    return jl_AbstractStringBuilder_charAt($this, var$1);
},
jl_StringBuilder_length = $this => {
    return jl_AbstractStringBuilder_length($this);
},
jl_StringBuilder_toString = $this => {
    return jl_AbstractStringBuilder_toString($this);
},
jl_StringBuilder_ensureCapacity = ($this, var$1) => {
    jl_AbstractStringBuilder_ensureCapacity($this, var$1);
},
jl_StringBuilder_insert3 = ($this, var$1, var$2) => {
    return $this.$insert3(var$1, var$2);
};
let jl_StringBuilder_insert0 = ($this, var$1, var$2) => {
    return $this.$insert4(var$1, var$2);
},
jl_StringBuilder_insert4 = ($this, var$1, var$2) => {
    return $this.$insert5(var$1, var$2);
};
function jl_Class() {
    let a = this; jl_Object.call(a);
    a.$flags = 0;
    a.$classInfo = null;
    a.$name = null;
}
let jl_Class__init_0 = ($this, $classInfo) => {
    jl_Object__init_($this);
    $this.$classInfo = $classInfo;
},
jl_Class__init_ = var_0 => {
    let var_1 = new jl_Class();
    jl_Class__init_0(var_1, var_0);
    return var_1;
},
jl_Class_createClass = $classInfo => {
    return jl_Class__init_($classInfo);
},
jl_Class_toString = $this => {
    let var$1, var$2, var$3;
    var$1 = jl_Class_isInterface($this) ? $rt_s(13) : !jl_Class_isPrimitive($this) ? $rt_s(14) : $rt_s(0);
    var$2 = jl_Class_getName($this);
    var$3 = jl_StringBuilder__init_();
    jl_StringBuilder_append(jl_StringBuilder_append(var$3, var$1), var$2);
    return jl_StringBuilder_toString(var$3);
},
jl_Class_getName = $this => {
    let $metadataName, $result, $itemType, $itemName, var$5;
    if (!($this.$flags & 1)) {
        $this.$flags = $this.$flags | 1;
        $metadataName = $this.$classInfo[$rt_meta].name;
        $result = $metadataName === null ? null : $rt_str($metadataName);
        if ($result === null) {
            $itemType = $this.$classInfo[$rt_meta].itemType;
            if ($itemType !== null) {
                $itemName = jl_Class_getName($rt_cls($itemType));
                if ($itemName !== null) {
                    if ($itemType[$rt_meta].itemType !== null) {
                        var$5 = jl_StringBuilder__init_();
                        jl_StringBuilder_append(jl_StringBuilder_append0(var$5, 91), $itemName);
                        $result = jl_StringBuilder_toString(var$5);
                    } else {
                        var$5 = jl_StringBuilder__init_();
                        jl_StringBuilder_append0(jl_StringBuilder_append(jl_StringBuilder_append(var$5, $rt_s(15)), $itemName), 59);
                        $result = jl_StringBuilder_toString(var$5);
                    }
                }
            }
        }
        $this.$name = $result;
    }
    return $this.$name;
},
jl_Class_isPrimitive = $this => {
    return !$this.$classInfo[$rt_meta].primitiveKind ? 0 : 1;
},
jl_Class_isInterface = $this => {
    return !($this.$classInfo[$rt_meta].modifiers & 512) ? 0 : 1;
};
$rt_packages([-1, "java", 0, "lang", -1, "org", 2, "teavm", 3, "classlib", 4, "impl", 5, "console", 4, "java", 7, "lang"
]);
$rt_metadata([jl_Object, "Object", 1, 0, [], 1, 0, 0, ["$getClass", $rt_wrapFunction0(jl_Object_getClass), "$toString", $rt_wrapFunction0(jl_Object_toString), "$identity", $rt_wrapFunction0(jl_Object_identity)],
jl_Throwable, 0, jl_Object, [], 1, 0, 0, ["$fillInStackTrace", $rt_wrapFunction0(jl_Throwable_fillInStackTrace), "$getMessage", $rt_wrapFunction0(jl_Throwable_getMessage), "$getLocalizedMessage", $rt_wrapFunction0(jl_Throwable_getLocalizedMessage), "$getCause", $rt_wrapFunction0(jl_Throwable_getCause), "$toString", $rt_wrapFunction0(jl_Throwable_toString)],
otvf_RecursiveFactorial, 0, jl_Object, [], 17, 0, otvf_RecursiveFactorial_$callClinit, 0,
jl_Exception, 0, jl_Throwable, [], 1, 0, 0, ["$_init_", $rt_wrapFunction0(jl_Exception__init_0), "$_init_0", $rt_wrapFunction1(jl_Exception__init_)],
jl_RuntimeException, "RuntimeException", 1, jl_Exception, [], 1, 0, 0, ["$_init_", $rt_wrapFunction0(jl_RuntimeException__init_), "$_init_0", $rt_wrapFunction1(jl_RuntimeException__init_0)],
jl_IndexOutOfBoundsException, "IndexOutOfBoundsException", 1, jl_RuntimeException, [], 1, 0, 0, ["$_init_", $rt_wrapFunction0(jl_IndexOutOfBoundsException__init_)],
ju_Arrays, 0, jl_Object, [], 1, 0, 0, 0,
jl_Runnable, 0, jl_Object, [], 1537, 0, 0, 0,
otcjl_TestObject, "TestObject", 8, jl_Object, [jl_Runnable], 1, 0, 0, 0,
jl_System, 0, jl_Object, [], 17, 0, 0, 0,
jl_AutoCloseable, 0, jl_Object, [], 1537, 0, 0, 0,
ji_Closeable, 0, jl_Object, [jl_AutoCloseable], 1537, 0, 0, 0,
ji_Flushable, 0, jl_Object, [], 1537, 0, 0, 0,
ji_OutputStream, 0, jl_Object, [ji_Closeable, ji_Flushable], 1025, 0, 0, ["$_init_", $rt_wrapFunction0(ji_OutputStream__init_)],
ji_FilterOutputStream, 0, ji_OutputStream, [], 1, 0, 0, ["$_init_1", $rt_wrapFunction1(ji_FilterOutputStream__init_)],
jl_Appendable, 0, jl_Object, [], 1537, 0, 0, 0,
ji_PrintStream, 0, ji_FilterOutputStream, [jl_Appendable], 1, 0, 0, ["$_init_2", $rt_wrapFunction3(ji_PrintStream__init_)],
otcic_JsConsolePrintStream, 0, ji_PrintStream, [], 1025, 0, 0, ["$_init_", $rt_wrapFunction0(otcic_JsConsolePrintStream__init_), "$println0", $rt_wrapFunction1(otcic_JsConsolePrintStream_println), "$println", $rt_wrapFunction1(otcic_JsConsolePrintStream_println0)],
otcic_JSStdoutPrintStream, "JSStdoutPrintStream", 6, otcic_JsConsolePrintStream, [], 1, 0, 0, ["$_init_", $rt_wrapFunction0(otcic_JSStdoutPrintStream__init_), "$print", $rt_wrapFunction1(otcic_JSStdoutPrintStream_print)],
ji_Serializable, 0, jl_Object, [], 1537, 0, 0, 0,
jl_Number, 0, jl_Object, [ji_Serializable], 1025, 0, 0, 0,
jl_Comparable, 0, jl_Object, [], 1537, 0, 0, 0,
jl_Integer, 0, jl_Number, [jl_Comparable], 1, 0, jl_Integer_$callClinit, 0,
jl_ClassCastException, 0, jl_RuntimeException, [], 1, 0, 0, 0,
otji_JSWrapper, 0, jl_Object, [], 17, 0, 0, 0,
otp_Platform, 0, jl_Object, [], 17, 0, 0, 0,
jl_Character, 0, jl_Object, [jl_Comparable], 1, 0, jl_Character_$callClinit, 0,
jnc_Charset, 0, jl_Object, [jl_Comparable], 1025, 0, 0, 0,
otci_IntegerUtil, 0, jl_Object, [], 17, 0, 0, 0,
jl_CharSequence, 0, jl_Object, [], 1537, 0, 0, 0,
jl_AbstractStringBuilder, "AbstractStringBuilder", 1, jl_Object, [ji_Serializable, jl_CharSequence], 0, 0, 0, ["$_init_", $rt_wrapFunction0(jl_AbstractStringBuilder__init_0), "$_init_3", $rt_wrapFunction1(jl_AbstractStringBuilder__init_), "$_init_0", $rt_wrapFunction1(jl_AbstractStringBuilder__init_2), "$_init_5", $rt_wrapFunction1(jl_AbstractStringBuilder__init_1), "$append4", $rt_wrapFunction1(jl_AbstractStringBuilder_append2), "$append5", $rt_wrapFunction1(jl_AbstractStringBuilder_append), "$insert0", $rt_wrapFunction2(jl_AbstractStringBuilder_insert),
"$append6", $rt_wrapFunction1(jl_AbstractStringBuilder_append1), "$append1", $rt_wrapFunction2(jl_AbstractStringBuilder_append3), "$insert1", $rt_wrapFunction3(jl_AbstractStringBuilder_insert2), "$append7", $rt_wrapFunction1(jl_AbstractStringBuilder_append0), "$insert2", $rt_wrapFunction2(jl_AbstractStringBuilder_insert1), "$insert", $rt_wrapFunction2(jl_AbstractStringBuilder_insert0), "$ensureCapacity", $rt_wrapFunction1(jl_AbstractStringBuilder_ensureCapacity), "$toString", $rt_wrapFunction0(jl_AbstractStringBuilder_toString),
"$length", $rt_wrapFunction0(jl_AbstractStringBuilder_length), "$charAt", $rt_wrapFunction1(jl_AbstractStringBuilder_charAt)],
otrr_ReflectionInfo, 0, jl_Object, [], 1025, 0, 0, 0,
otr_StringInfo, 0, otrr_ReflectionInfo, [], 17, 0, 0, 0,
jl_Math, 0, jl_Object, [], 17, 0, 0, 0,
jl_String, "String", 1, jl_Object, [ji_Serializable, jl_Comparable, jl_CharSequence], 1, 0, jl_String_$callClinit, ["$_init_", $rt_wrapFunction0(jl_String__init_1), "$_init_4", $rt_wrapFunction1(jl_String__init_), "$_init_8", $rt_wrapFunction1(jl_String__init_0), "$_init_6", $rt_wrapFunction3(jl_String__init_2), "$charAt", $rt_wrapFunction1(jl_String_charAt), "$length", $rt_wrapFunction0(jl_String_length), "$isEmpty", $rt_wrapFunction0(jl_String_isEmpty), "$toString", $rt_wrapFunction0(jl_String_toString)],
jlr_AnnotatedElement, 0, jl_Object, [], 1537, 0, 0, 0,
jlr_GenericDeclaration, 0, jl_Object, [jlr_AnnotatedElement], 1537, 0, 0, 0,
otcic_JSStderrPrintStream, "JSStderrPrintStream", 6, otcic_JsConsolePrintStream, [], 1, 0, 0, ["$_init_", $rt_wrapFunction0(otcic_JSStderrPrintStream__init_), "$print", $rt_wrapFunction1(otcic_JSStderrPrintStream_print)],
otji_JS, 0, jl_Object, [], 17, 0, 0, 0,
jl_StringIndexOutOfBoundsException, "StringIndexOutOfBoundsException", 1, jl_IndexOutOfBoundsException, [], 1, 0, 0, ["$_init_", $rt_wrapFunction0(jl_StringIndexOutOfBoundsException__init_0)],
otv_StepRecorder, 0, jl_Object, [], 17, 0, otv_StepRecorder_$callClinit, 0,
ju_Objects, 0, jl_Object, [], 17, 0, 0, 0,
jlr_Type, 0, jl_Object, [], 1537, 0, 0, 0,
otrr_ClassInfo, 0, otrr_ReflectionInfo, [], 17, 0, 0, 0,
ju_Comparator, 0, jl_Object, [], 1537, 0, 0, 0,
jl_String$_clinit_$lambda$_118_0, "String$<clinit>$lambda$_118_0", 1, jl_Object, [ju_Comparator], 1, 0, 0, ["$_init_", $rt_wrapFunction0(jl_String$_clinit_$lambda$_118_0__init_)],
jl_StringBuilder, "StringBuilder", 1, jl_AbstractStringBuilder, [jl_Appendable], 1, 0, 0, ["$_init_", $rt_wrapFunction0(jl_StringBuilder__init_1), "$_init_0", $rt_wrapFunction1(jl_StringBuilder__init_0), "$append", $rt_wrapFunction1(jl_StringBuilder_append), "$append3", $rt_wrapFunction1(jl_StringBuilder_append2), "$append2", $rt_wrapFunction1(jl_StringBuilder_append1), "$append0", $rt_wrapFunction1(jl_StringBuilder_append0), "$insert3", $rt_wrapFunction2(jl_StringBuilder_insert), "$insert4", $rt_wrapFunction2(jl_StringBuilder_insert2),
"$insert5", $rt_wrapFunction2(jl_StringBuilder_insert1), "$charAt", $rt_wrapFunction1(jl_StringBuilder_charAt), "$length", $rt_wrapFunction0(jl_StringBuilder_length), "$toString", $rt_wrapFunction0(jl_StringBuilder_toString), "$ensureCapacity", $rt_wrapFunction1(jl_StringBuilder_ensureCapacity), "$insert", $rt_wrapFunction2(jl_StringBuilder_insert3), "$insert2", $rt_wrapFunction2(jl_StringBuilder_insert0), "$insert0", $rt_wrapFunction2(jl_StringBuilder_insert4)],
jl_Class, "Class", 1, jl_Object, [jlr_GenericDeclaration, jlr_Type], 17, 0, 0, ["$toString", $rt_wrapFunction0(jl_Class_toString), "$getName", $rt_wrapFunction0(jl_Class_getName), "$isPrimitive", $rt_wrapFunction0(jl_Class_isPrimitive), "$isInterface", $rt_wrapFunction0(jl_Class_isInterface)]]);
let $rt_charArrayCls = $rt_arraycls($rt_charcls),
$rt_intArrayCls = $rt_arraycls($rt_intcls);
$rt_stringPool(["", ": ", "org.teavm.visualizer.fixture.RecursiveFactorial", "factorial", "n", "main", "args", "\n", "null", "0", "\u0000VIZ:step", "\u0000VIZ:var:", "\u0000VIZ:truncated", "interface ", "class ", "[L"]);
jl_String.prototype.toString = function() {
    return $rt_ustr(this);
};
jl_String.prototype.valueOf = jl_String.prototype.toString;
jl_Object.prototype.toString = function() {
    return $rt_ustr(jl_Object_toString(this));
};
jl_Object.prototype.__teavm_class__ = function() {
    return $dbg_class(this);
};
let $rt_export_main = $rt_mainStarter(otvf_RecursiveFactorial_main);
$rt_export_main.javaException = $rt_javaException;
$rt_exports.main = $rt_export_main;
}));

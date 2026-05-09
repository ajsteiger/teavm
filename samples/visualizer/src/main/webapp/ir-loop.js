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
$rt_classReflectionMetadata = cls => {
    if (cls[$rt_meta].reflection === null) {
        cls[$rt_meta].reflection = { annotations : [], fields : [], methods : [], typeParameters : [] };
    }
    return cls[$rt_meta].reflection;
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
$rt_compare = (a, b) => a === b ? 0 : a < b ?  -1 : 1,
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
Long_ZERO = BigInt(0),
Long_fromInt = val => BigInt.asIntN(64, BigInt(val | 0)),
Long_ne = (a, b) => a !== b,
$rt_createArray = (cls, sz) => {
    let data = new Array(sz);
    data.fill(null);
    return new ($rt_arraycls(cls))(data);
},
$rt_wrapArray = (cls, data) => new ($rt_arraycls(cls))(data),
$rt_createCharArray = sz => new $rt_charArrayCls(new Uint16Array(sz)),
$rt_createIntArray = sz => new $rt_intArrayCls(new Int32Array(sz)),
$rt_createIntArrayFromData = data => {
    let buffer = new Int32Array(data.length);
    buffer.set(data);
    return new $rt_intArrayCls(buffer);
},
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
        JavaArray.prototype.$clone0 = function() {
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
$rt_fullArrayToString = array => $rt_charArrayToString(array, 0, array.length),
$rt_str = str => str === null ? null : jl_String__init_0(str),
$rt_ustr = str => str === null ? null : str.$nativeString,
$rt_stringClassInit = () => jl_String_$callClinit(),
$rt_intern;
{
    $rt_intern = str => str;
}
let $rt_isInstance = (obj, cls) => obj instanceof $rt_objcls() && !!obj.constructor[$rt_meta] && $rt_isAssignable(obj.constructor, cls),
$rt_isAssignable = (from, to) => {
    if (from === to) {
        return true;
    }
    let map = from[$rt_meta].assignableCache;
    if (map === null) {
        map = new Map();
        from[$rt_meta].assignableCache = map;
    }
    let cachedResult = map.get(to);
    if (typeof cachedResult !== 'undefined') {
        return cachedResult;
    }
    if (to[$rt_meta].itemType !== null) {
        let result = from[$rt_meta].itemType !== null && $rt_isAssignable(from[$rt_meta].itemType, to[$rt_meta].itemType);
        map.set(to, result);
        return result;
    }
    let parent = from[$rt_meta].parent;
    if (parent !== null && parent !== from) {
        if ($rt_isAssignable(parent, to)) {
            map.set(to, true);
            return true;
        }
    }
    let superinterfaces = from[$rt_meta].superinterfaces;
    for (let i = 0;i < superinterfaces.length;i = i + 1 | 0) {
        if ($rt_isAssignable(superinterfaces[i], to)) {
            map.set(to, true);
            return true;
        }
    }
    map.set(to, false);
    return false;
},
$rt_getFieldValue = (field, obj) => {
    return field.type[$rt_meta].valueToObject(field.reader(obj));
},
$rt_throw = ex => {
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
$rt_wrapException = err => {
    let ex = err[$rt_javaExceptionProp];
    if (!ex) {
        ex = $rt_createException($rt_str("(JavaScript) " + err.toString()));
        err[$rt_javaExceptionProp] = ex;
        ex.$jsException = err;
        $rt_fillStack(err, ex);
    }
    return ex;
},
$rt_createException = message => jl_RuntimeException__init_1(message),
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
$rt_reflection = data => {
    let i = 0;
    while (i < data.length) {
        let cls = data[i++];
        let clsData = $rt_classReflectionMetadata(cls);
        let obj = data[i++];
        {
            let resolvedFields;
            let fields = obj.f;
            if (typeof fields !== "undefined") {
                resolvedFields = new Array(fields.length);
                for (let j = 0;j < fields.length;++j) {
                    resolvedFields[j] = $rt_readFieldMetadata(cls, fields[j]);
                }
            } else {
                resolvedFields = [];
            }
            clsData.fields = resolvedFields;
        }
    }
},
$rt_readFieldMetadata = (cls, field) => {
    let writer = field[4];
    let fieldReflection = field[5];
    let resolvedFieldReflection;
    if (fieldReflection !== void 0) {
        resolvedFieldReflection = { annotations : fieldReflection.a !== void 0 ? $rt_readAnnotations(fieldReflection.a) : [], genericType : fieldReflection.t !== void 0 ? $rt_readGenericType(fieldReflection.t) : null };
    } else {
        resolvedFieldReflection = null;
    }
    return { cls : cls, name : field[0], modifiers : field[1], type : field[2], reader : field[3], writer : writer !== 0 ? writer : null, reflection : resolvedFieldReflection };
},
$rt_readAnnotations = annotations => {
    let resolvedAnnotations = new Array(annotations.length);
    for (let j = 0;j < annotations.length;++j) {
        resolvedAnnotations[j] = $rt_readAnnotation(annotations[j]);
    }
    return resolvedAnnotations;
},
$rt_readAnnotation = annotation => {
    return [annotation[0], annotation.slice(1)];
},
$rt_readGenericType = data => {
    let kind = data[0];
    switch (kind) {
        case 0:
            {
                let typeArgsData = data.length > 2 ? data[2] : [];
                let typeArguments = new Array(typeArgsData.length);
                for (let i = 0;i < typeArgsData.length;++i) {
                    typeArguments[i] = $rt_readGenericType(typeArgsData[i]);
                }
                return { kind : 0, rawType : data[1], actualTypeArguments : typeArguments, ownerType : data.length > 3 ? $rt_readGenericType(data[3]) : null };
            }
        case 1:
            return { kind : 1, index : data[1], level : data.length > 2 ? data[2] : 0 };
        case 2:
            return { kind : 2, itemType : $rt_readGenericType(data[1]) };
        case 3:
        case 4:
            return { kind : kind, bound : $rt_readGenericType(data[1]) };
        case 5:
            return { kind : 5 };
        case 6:
            return { kind : 6, rawType : data[1] };
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
},
jl_Object_clone = $this => {
    let $cls, $result, var$3, var$4;
    $cls = jl_Class_getClassInfo(jl_Object_getClass($this));
    if (!$rt_isInstance($this, jl_Cloneable) && $cls[$rt_meta].itemType === null)
        $rt_throw(jl_CloneNotSupportedException__init_0());
    $result = otp_Platform_clone($this);
    var$3 = $result;
    var$4 = $rt_nextId();
    var$3.$id$ = var$4;
    return $result;
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
jl_Exception = $rt_classWithoutFields(jl_Throwable),
jl_Exception__init_ = $this => {
    jl_Throwable__init_($this);
},
jl_Exception__init_1 = () => {
    let var_0 = new jl_Exception();
    jl_Exception__init_(var_0);
    return var_0;
},
jl_Exception__init_0 = ($this, $message) => {
    jl_Throwable__init_0($this, $message);
},
jl_Exception__init_2 = var_0 => {
    let var_1 = new jl_Exception();
    jl_Exception__init_0(var_1, var_0);
    return var_1;
},
jl_RuntimeException = $rt_classWithoutFields(jl_Exception),
jl_RuntimeException__init_ = $this => {
    jl_Exception__init_($this);
},
jl_RuntimeException__init_2 = () => {
    let var_0 = new jl_RuntimeException();
    jl_RuntimeException__init_(var_0);
    return var_0;
},
jl_RuntimeException__init_0 = ($this, $message) => {
    jl_Exception__init_0($this, $message);
},
jl_RuntimeException__init_1 = var_0 => {
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
jl_System_identityHashCode = $x => {
    return $x === null ? 0 : jl_Object_identity($x);
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
jl_Integer_toUnsignedString = $value => {
    let $sz, $v, var$4, $chars, var$6;
    jl_Integer_$callClinit();
    $sz = 0;
    $v = $value;
    while (Long_ne(Long_fromInt($v), Long_ZERO)) {
        $v = $rt_udiv($v, 10);
        $sz = $sz + 1 | 0;
    }
    var$4 = jl_Math_max($sz, 1);
    $chars = $rt_createCharArray(var$4);
    while (var$4 > 0) {
        var$6 = $chars.data;
        var$4 = var$4 + (-1) | 0;
        var$6[var$4] = jl_Character_forDigit($rt_umod($value, 10), 10);
        $value = $rt_udiv($value, 10);
    }
    return jl_String_fromArray($chars);
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
jl_AutoCloseable = $rt_classWithoutFields(0),
jl_CloneNotSupportedException = $rt_classWithoutFields(jl_Exception),
jl_CloneNotSupportedException__init_ = $this => {
    jl_Exception__init_($this);
},
jl_CloneNotSupportedException__init_0 = () => {
    let var_0 = new jl_CloneNotSupportedException();
    jl_CloneNotSupportedException__init_(var_0);
    return var_0;
},
jl_NullPointerException = $rt_classWithoutFields(jl_RuntimeException);
let jl_NullPointerException__init_ = $this => {
    jl_RuntimeException__init_($this);
},
jl_NullPointerException__init_0 = () => {
    let var_0 = new jl_NullPointerException();
    jl_NullPointerException__init_(var_0);
    return var_0;
},
jl_Character = $rt_classWithoutFields(),
jl_Character_TYPE = null,
jl_Character_characterCache = null,
jl_Character_$callClinit = () => {
    jl_Character_$callClinit = $rt_eraseClinit(jl_Character);
    jl_Character__clinit_();
},
jl_Character_highSurrogate = $codePoint => {
    let var$2;
    jl_Character_$callClinit();
    var$2 = $codePoint - 65536 | 0;
    return (55296 | var$2 >> 10 & 1023) & 65535;
},
jl_Character_lowSurrogate = $codePoint => {
    jl_Character_$callClinit();
    return (56320 | $codePoint & 1023) & 65535;
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
otci_IntegerUtil = $rt_classWithoutFields(),
otci_IntegerUtil_toUnsignedLogRadixString = ($value, $radixLog2) => {
    let $radix, $mask, $sz, $chars, $pos, $target, var$9, $target_0;
    if (!$value)
        return $rt_s(2);
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
    return jl_String__init_6($chars);
},
otrr_ReflectionInfo = $rt_classWithoutFields(),
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
otvf_LoopExample = $rt_classWithoutFields(),
otvf_LoopExample_$callClinit = () => {
    otvf_LoopExample_$callClinit = $rt_eraseClinit(otvf_LoopExample);
    otvf_LoopExample__clinit_();
},
otvf_LoopExample_sumTo = $n => {
    let $sum, $i;
    otvf_LoopExample_$callClinit();
    otv_StepRecorder_enterMethod($rt_s(3), $rt_s(4));
    otv_StepRecorder_step($rt_s(3), $rt_s(4), 26);
    otv_StepRecorder_captureVar($rt_s(5), $n);
    $sum = 0;
    otv_StepRecorder_step($rt_s(3), $rt_s(4), 27);
    otv_StepRecorder_captureVar($rt_s(5), $n);
    otv_StepRecorder_captureVar($rt_s(6), $sum);
    $i = 1;
    while (true) {
        otv_StepRecorder_step($rt_s(3), $rt_s(4), 28);
        otv_StepRecorder_captureVar($rt_s(5), $n);
        otv_StepRecorder_captureVar($rt_s(6), $sum);
        otv_StepRecorder_captureVar($rt_s(7), $i);
        if ($i > $n)
            break;
        otv_StepRecorder_step($rt_s(3), $rt_s(4), 29);
        otv_StepRecorder_captureVar($rt_s(5), $n);
        otv_StepRecorder_captureVar($rt_s(6), $sum);
        otv_StepRecorder_captureVar($rt_s(7), $i);
        $sum = $sum + $i | 0;
        otv_StepRecorder_step($rt_s(3), $rt_s(4), 30);
        otv_StepRecorder_captureVar($rt_s(5), $n);
        otv_StepRecorder_captureVar($rt_s(6), $sum);
        otv_StepRecorder_captureVar($rt_s(7), $i);
        $i = $i + 1 | 0;
    }
    otv_StepRecorder_step($rt_s(3), $rt_s(4), 32);
    otv_StepRecorder_captureVar($rt_s(5), $n);
    otv_StepRecorder_captureVar($rt_s(6), $sum);
    otv_StepRecorder_captureVar($rt_s(7), $i);
    otv_StepRecorder_exitMethod();
    return $sum;
},
otvf_LoopExample_main = $args => {
    otvf_LoopExample_$callClinit();
    otv_StepRecorder_enterMethod($rt_s(3), $rt_s(8));
    otv_StepRecorder_step($rt_s(3), $rt_s(8), 36);
    otv_StepRecorder_captureRef($rt_s(9), $args);
    (jl_System_out()).$println(otvf_LoopExample_sumTo(4));
    otv_StepRecorder_exitMethod();
},
otvf_LoopExample__clinit_ = () => {
    return;
},
jl_ReflectiveOperationException = $rt_classWithoutFields(jl_Exception),
jl_IllegalAccessException = $rt_classWithoutFields(jl_ReflectiveOperationException),
jl_Cloneable = $rt_classWithoutFields(0),
otji_JS = $rt_classWithoutFields(),
jl_CharSequence = $rt_classWithoutFields(0),
jlr_Member = $rt_classWithoutFields(0),
jl_StringIndexOutOfBoundsException = $rt_classWithoutFields(jl_IndexOutOfBoundsException),
jl_StringIndexOutOfBoundsException__init_0 = $this => {
    jl_IndexOutOfBoundsException__init_($this);
},
jl_StringIndexOutOfBoundsException__init_ = () => {
    let var_0 = new jl_StringIndexOutOfBoundsException();
    jl_StringIndexOutOfBoundsException__init_0(var_0);
    return var_0;
},
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
otrr_ClassReflectionInfo = $rt_classWithoutFields(otrr_ReflectionInfo),
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
otv_StepRecorder_captureRef = ($name, $value) => {
    let $id, $cls, var$5, $sb, $first, var$8, var$9, var$10, $f, $fval, $$je;
    otv_StepRecorder_$callClinit();
    if (otv_StepRecorder_truncated)
        return;
    if ($value === null) {
        otv_StepRecorder_jsCaptureVar($name, $rt_s(10));
        return;
    }
    if (!($value instanceof jl_String) && !($value instanceof jl_Number) && !($value instanceof jl_Boolean) && !($value instanceof jl_Character)) {
        $id = jl_System_identityHashCode($value);
        $cls = jl_Object_getClass($value);
        var$5 = (jl_StringBuilder__init_0($rt_s(11))).$append2(jl_Integer_toUnsignedString($id));
        $sb = ((var$5.$append2($rt_s(12))).$append2(jl_Class_getSimpleName($cls))).$append2($rt_s(13));
        $first = 1;
        var$8 = (jl_Class_getDeclaredFields($cls)).data;
        var$9 = var$8.length;
        var$10 = 0;
        while (var$10 < var$9) {
            a: {
                $f = var$8[var$10];
                if (!jlr_Modifier_isStatic($f.$getModifiers())) {
                    $f.$setAccessible(1);
                    b: {
                        try {
                            $fval = $f.$get($value);
                            break b;
                        } catch ($$e) {
                            $$je = $rt_wrapException($$e);
                            if ($$je instanceof jl_IllegalAccessException) {
                            } else {
                                throw $$e;
                            }
                        }
                        break a;
                    }
                    if (!$first)
                        $sb.$append2($rt_s(14));
                    $first = 0;
                    ($sb.$append2($f.$getName())).$append2($rt_s(15));
                    if ($fval === null)
                        $sb.$append2($rt_s(10));
                    else if (!($fval instanceof jl_String) && !($fval instanceof jl_Number) && !($fval instanceof jl_Boolean) && !($fval instanceof jl_Character))
                        ($sb.$append2($rt_s(11))).$append2(jl_Integer_toUnsignedString(jl_System_identityHashCode($fval)));
                    else
                        $sb.$append($fval);
                }
            }
            var$10 = var$10 + 1 | 0;
        }
        $sb.$append2($rt_s(16));
        otv_StepRecorder_jsCaptureVar($name, $sb.$toString());
        return;
    }
    otv_StepRecorder_jsCaptureVar($name, $value.$toString());
},
otv_StepRecorder_captureVar = ($name, $value) => {
    otv_StepRecorder_$callClinit();
    if (!otv_StepRecorder_truncated)
        otv_StepRecorder_jsCaptureVar($name, jl_String_valueOf($value));
},
otv_StepRecorder_jsStep = ($className, $methodName, $line) => {
    let $sb, $i, var$6;
    otv_StepRecorder_$callClinit();
    $sb = jl_StringBuilder__init_0($rt_s(17));
    $i = 0;
    while ($i < otv_StepRecorder_depth) {
        var$6 = ($sb.$append0(58)).$append2(otv_StepRecorder_frameClass.data[$i]);
        var$6 = (var$6.$append0(58)).$append2(otv_StepRecorder_frameMeth.data[$i]);
        (var$6.$append0(58)).$append3(otv_StepRecorder_frameLine.data[$i]);
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
    jl_StringBuilder_append(jl_StringBuilder_append0(jl_StringBuilder_append(jl_StringBuilder_append(var$4, $rt_s(18)), $name), 61), $value);
    var$3.$println0(jl_StringBuilder_toString(var$4));
},
otv_StepRecorder_jsStepLimitReached = () => {
    otv_StepRecorder_$callClinit();
    (jl_System_err()).$println0($rt_s(19));
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
jlr_Modifier = $rt_classWithoutFields(),
jlr_Modifier_modifierNames = null,
jlr_Modifier_canonicalOrder = null,
jlr_Modifier_$callClinit = () => {
    jlr_Modifier_$callClinit = $rt_eraseClinit(jlr_Modifier);
    jlr_Modifier__clinit_();
},
jlr_Modifier_isStatic = $mod => {
    jlr_Modifier_$callClinit();
    return !($mod & 8) ? 0 : 1;
},
jlr_Modifier_toString0 = $mod => {
    jlr_Modifier_$callClinit();
    return jlr_Modifier_toString($mod, 0);
},
jlr_Modifier_toString = ($mod, $abstractExpected) => {
    let $sb, $modifierNames, $index, var$6, var$7, var$8, $modifier;
    jlr_Modifier_$callClinit();
    $sb = jl_StringBuilder__init_();
    $modifierNames = jlr_Modifier_getModifierNames();
    $index = 0;
    var$6 = jlr_Modifier_canonicalOrder.data;
    var$7 = var$6.length;
    var$8 = 0;
    while (var$8 < var$7) {
        $modifier = var$6[var$8];
        if ($modifier == 1024 && $abstractExpected) {
            if (!($mod & 1024)) {
                if ($sb.$length() > 0)
                    $sb.$append0(32);
                $sb.$append2($rt_s(20));
            }
        } else if ($mod & $modifier) {
            if ($sb.$length() > 0)
                $sb.$append0(32);
            $sb.$append2($modifierNames.data[$index]);
        }
        $index = $index + 1 | 0;
        var$8 = var$8 + 1 | 0;
    }
    return $sb.$toString();
},
jlr_Modifier_getModifierNames = () => {
    jlr_Modifier_$callClinit();
    if (jlr_Modifier_modifierNames === null)
        jlr_Modifier_modifierNames = $rt_wrapArray(jl_String, [$rt_s(21), $rt_s(22), $rt_s(23), $rt_s(24), $rt_s(25), $rt_s(26), $rt_s(27), $rt_s(28), $rt_s(29), $rt_s(30), $rt_s(31), $rt_s(32)]);
    return jlr_Modifier_modifierNames;
},
jlr_Modifier__clinit_ = () => {
    jlr_Modifier_canonicalOrder = $rt_createIntArrayFromData([1, 4, 2, 1024, 8, 16, 128, 64, 32, 256, 2048, 512]);
},
ju_Comparator = $rt_classWithoutFields(0),
jl_String$_clinit_$lambda$_118_0 = $rt_classWithoutFields(),
jl_String$_clinit_$lambda$_118_0__init_ = var$0 => {
    jl_Object__init_(var$0);
},
jl_String$_clinit_$lambda$_118_0__init_0 = () => {
    let var_0 = new jl_String$_clinit_$lambda$_118_0();
    jl_String$_clinit_$lambda$_118_0__init_(var_0);
    return var_0;
};
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
            $string = $rt_s(10);
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
    return $this.$insert0($index, $obj === null ? $rt_s(10) : $obj.$toString());
},
jl_AbstractStringBuilder_ensureCapacity = ($this, $capacity) => {
    let $newLength;
    if ($this.$buffer.data.length >= $capacity)
        return;
    $newLength = $this.$buffer.data.length >= 1073741823 ? 2147483647 : jl_Math_max($capacity, jl_Math_max($this.$buffer.data.length * 2 | 0, 5));
    $this.$buffer = ju_Arrays_copyOf($this.$buffer, $newLength);
},
jl_AbstractStringBuilder_toString = $this => {
    return jl_String__init_5($this.$buffer, 0, $this.$length0);
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
jl_Appendable = $rt_classWithoutFields(0),
jl_StringBuilder = $rt_classWithoutFields(jl_AbstractStringBuilder),
jl_StringBuilder__init_2 = $this => {
    jl_AbstractStringBuilder__init_0($this);
},
jl_StringBuilder__init_ = () => {
    let var_0 = new jl_StringBuilder();
    jl_StringBuilder__init_2(var_0);
    return var_0;
},
jl_StringBuilder__init_1 = ($this, $value) => {
    jl_AbstractStringBuilder__init_2($this, $value);
},
jl_StringBuilder__init_0 = var_0 => {
    let var_1 = new jl_StringBuilder();
    jl_StringBuilder__init_1(var_1, var_0);
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
},
jl_StringBuilder_insert0 = ($this, var$1, var$2) => {
    return $this.$insert4(var$1, var$2);
},
jl_StringBuilder_insert4 = ($this, var$1, var$2) => {
    return $this.$insert5(var$1, var$2);
},
jlr_AnnotatedElement = $rt_classWithoutFields(0);
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
    $this.$print($rt_s(33));
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
        $s = $rt_s(10);
    $rt_putStdout($rt_ustr($s));
},
jl_ClassCastException = $rt_classWithoutFields(jl_RuntimeException),
otji_JSWrapper = $rt_classWithoutFields(),
otrr_DerivedClassInfo = $rt_classWithoutFields(otrr_ReflectionInfo),
otp_Platform = $rt_classWithoutFields(),
otp_Platform_clone = var$1 => {
    let copy = new var$1.constructor();
    for (let field in var$1) {
        if (var$1.hasOwnProperty(field)) {
            copy[field] = var$1[field];
        }
    }
    return copy;
},
jnc_Charset = $rt_classWithoutFields(),
otr_StringInfo = $rt_classWithoutFields(otrr_ReflectionInfo),
jl_Boolean = $rt_classWithoutFields(),
jl_String = $rt_classWithoutFields(),
jl_String_EMPTY_CHARS = null,
jl_String_EMPTY = null,
jl_String_CASE_INSENSITIVE_ORDER = null,
jl_String_$callClinit = () => {
    jl_String_$callClinit = $rt_eraseClinit(jl_String);
    jl_String__clinit_();
},
jl_String__init_2 = $this => {
    jl_String_$callClinit();
    jl_Object__init_($this);
    $this.$nativeString = "";
},
jl_String__init_3 = () => {
    let var_0 = new jl_String();
    jl_String__init_2(var_0);
    return var_0;
},
jl_String__init_ = ($this, $characters) => {
    let var$2;
    jl_String_$callClinit();
    var$2 = $characters.data;
    jl_Object__init_($this);
    $this.$nativeString = $rt_charArrayToString($characters.data, 0, var$2.length);
},
jl_String__init_6 = var_0 => {
    let var_1 = new jl_String();
    jl_String__init_(var_1, var_0);
    return var_1;
},
jl_String__init_1 = (var$0, var$1) => {
    var$0.$nativeString = var$1;
},
jl_String__init_0 = var_0 => {
    let var_1 = new jl_String();
    jl_String__init_1(var_1, var_0);
    return var_1;
},
jl_String__init_4 = (var$0, var$1, $offset, $count) => {
    let var$4;
    jl_String_$callClinit();
    var$4 = var$1.data;
    jl_Object__init_(var$0);
    ju_Objects_checkFromIndexSize($offset, $count, var$4.length);
    var$0.$nativeString = $rt_charArrayToString(var$1.data, $offset, $count);
},
jl_String__init_5 = (var_0, var_1, var_2) => {
    let var_3 = new jl_String();
    jl_String__init_4(var_3, var_0, var_1, var_2);
    return var_3;
},
jl_String_fromArray = $characters => {
    let $s;
    jl_String_$callClinit();
    $s = jl_String__init_3();
    $s.$nativeString = $rt_fullArrayToString($characters.data);
    return $s;
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
jl_String_lastIndexOf0 = ($this, $ch, $fromIndex) => {
    let $i, $bmpChar, $hi, $lo, var$7;
    $i = jl_Math_min($fromIndex, $this.$length() - 1 | 0);
    if ($ch < 65536) {
        $bmpChar = $ch & 65535;
        while (true) {
            if ($i < 0)
                return (-1);
            if ($this.$nativeString.charCodeAt($i) == $bmpChar)
                break;
            $i = $i + (-1) | 0;
        }
        return $i;
    }
    $hi = jl_Character_highSurrogate($ch);
    $lo = jl_Character_lowSurrogate($ch);
    while (true) {
        if ($i < 1)
            return (-1);
        if ($this.$nativeString.charCodeAt($i) == $lo) {
            var$7 = $i - 1 | 0;
            if ($this.$nativeString.charCodeAt(var$7) == $hi)
                break;
        }
        $i = $i + (-1) | 0;
    }
    return var$7;
},
jl_String_lastIndexOf = ($this, $ch) => {
    return $this.$lastIndexOf($ch, $this.$length() - 1 | 0);
},
jl_String_substring0 = ($this, $beginIndex, $endIndex) => {
    let $length, var$4;
    $length = $this.$nativeString.length;
    var$4 = $rt_compare($beginIndex, $endIndex);
    if (!var$4)
        return jl_String_EMPTY;
    if (!$beginIndex && $endIndex == $length)
        return $this;
    if ($beginIndex >= 0 && var$4 <= 0 && $endIndex <= $length)
        return jl_String__init_0($this.$nativeString.substring($beginIndex, $endIndex));
    $rt_throw(jl_StringIndexOutOfBoundsException__init_());
},
jl_String_substring = ($this, $beginIndex) => {
    return $this.$substring($beginIndex, $this.$length());
},
jl_String_toString = $this => {
    return $this;
},
jl_String_valueOf = $i => {
    jl_String_$callClinit();
    return ((jl_StringBuilder__init_()).$append3($i)).$toString();
},
jl_String__clinit_ = () => {
    jl_String_EMPTY_CHARS = $rt_createCharArray(0);
    jl_String_EMPTY = jl_String__init_3();
    jl_String_CASE_INSENSITIVE_ORDER = jl_String$_clinit_$lambda$_118_0__init_0();
},
jlr_GenericDeclaration = $rt_classWithoutFields(0),
otcic_JSStderrPrintStream = $rt_classWithoutFields(otcic_JsConsolePrintStream),
otcic_JSStderrPrintStream__init_ = $this => {
    otcic_JsConsolePrintStream__init_($this);
},
otcic_JSStderrPrintStream__init_0 = () => {
    let var_0 = new otcic_JSStderrPrintStream();
    otcic_JSStderrPrintStream__init_(var_0);
    return var_0;
},
otcic_JSStderrPrintStream_print = ($this, $s) => {
    if ($s === null)
        $s = $rt_s(10);
    $rt_putStderr($rt_ustr($s));
},
jlr_AccessibleObject = $rt_classWithoutFields(),
jlr_AccessibleObject__init_ = $this => {
    jl_Object__init_($this);
},
jlr_AccessibleObject__init_0 = () => {
    let var_0 = new jlr_AccessibleObject();
    jlr_AccessibleObject__init_(var_0);
    return var_0;
};
let jlr_AccessibleObject_setAccessible = ($this, $flag) => {
    return;
},
otrr_FieldInfo = $rt_classWithoutFields(otrr_ReflectionInfo);
function jlr_Field() {
    let a = this; jlr_AccessibleObject.call(a);
    a.$declaringClass = null;
    a.$fieldInfo = null;
}
let jlr_Field__init_ = ($this, $declaringClass, $fieldInfo) => {
    jlr_AccessibleObject__init_($this);
    $this.$declaringClass = $declaringClass;
    $this.$fieldInfo = $fieldInfo;
},
jlr_Field__init_0 = (var_0, var_1) => {
    let var_2 = new jlr_Field();
    jlr_Field__init_(var_2, var_0, var_1);
    return var_2;
},
jlr_Field_getName = $this => {
    return $rt_str($this.$fieldInfo.name);
},
jlr_Field_getModifiers = $this => {
    return $this.$fieldInfo.modifiers & 4095;
},
jlr_Field_getType = $this => {
    return $rt_cls(otrr_ClassInfoUtil_resolve($this.$fieldInfo.type));
},
jlr_Field_toString = $this => {
    let $sb;
    $sb = jl_StringBuilder__init_();
    $sb.$append2(jlr_Modifier_toString0($this.$getModifiers()));
    if ($sb.$length() > 0)
        $sb.$append0(32);
    (((($sb.$append2(jl_Class_getName($this.$getType()))).$append0(32)).$append2(jl_Class_getName($this.$declaringClass))).$append2($rt_s(34))).$append2($this.$getName());
    return $sb.$toString();
},
jlr_Field_get = ($this, $obj) => {
    $this.$checkGetAccess();
    jlr_Field_checkInstance($this, $obj);
    return $this.$getWithoutCheck($obj);
},
jlr_Field_getWithoutCheck = ($this, $obj) => {
    if ($this.$fieldInfo.modifiers & 8)
        jl_Class_initialize($this.$declaringClass);
    return $rt_getFieldValue($this.$fieldInfo, $obj);
},
jlr_Field_checkInstance = ($this, $obj) => {
    if (!($this.$fieldInfo.modifiers & 8)) {
        if ($obj === null)
            $rt_throw(jl_NullPointerException__init_0());
        if (!jl_Class_isInstance($this.$declaringClass, $obj))
            $rt_throw(jl_IllegalArgumentException__init_0());
    }
},
jlr_Field_checkGetAccess = $this => {
    return;
},
jl_IllegalArgumentException = $rt_classWithoutFields(jl_RuntimeException),
jl_IllegalArgumentException__init_ = $this => {
    jl_RuntimeException__init_($this);
},
jl_IllegalArgumentException__init_0 = () => {
    let var_0 = new jl_IllegalArgumentException();
    jl_IllegalArgumentException__init_(var_0);
    return var_0;
},
otrr_ClassInfoUtil = $rt_classWithoutFields(),
otrr_ClassInfoUtil_resolve = $info => {
    let $cls, $i;
    $cls = $info;
    $i = 0;
    while ($i < 0) {
        $cls = $rt_arraycls($cls);
        $i = $i + 1 | 0;
    }
    return $cls;
},
otrr_ClassInfo = $rt_classWithoutFields(otrr_ReflectionInfo);
function jl_Class() {
    let a = this; jl_Object.call(a);
    a.$flags = 0;
    a.$classInfo = null;
    a.$name = null;
    a.$simpleName = null;
    a.$declaredFields = null;
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
    var$1 = jl_Class_isInterface($this) ? $rt_s(35) : !jl_Class_isPrimitive($this) ? $rt_s(36) : $rt_s(0);
    var$2 = jl_Class_getName($this);
    var$3 = jl_StringBuilder__init_();
    jl_StringBuilder_append(jl_StringBuilder_append(var$3, var$1), var$2);
    return jl_StringBuilder_toString(var$3);
},
jl_Class_getClassInfo = $this => {
    return $this.$classInfo;
},
jl_Class_isInstance = ($this, $obj) => {
    return $obj !== null && jl_Class_isAssignableFrom($this, jl_Object_getClass($obj)) ? 1 : 0;
},
jl_Class_isAssignableFrom = ($this, $obj) => {
    return $rt_isAssignable($obj.$classInfo, $this.$classInfo);
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
                        jl_StringBuilder_append0(jl_StringBuilder_append(jl_StringBuilder_append(var$5, $rt_s(37)), $itemName), 59);
                        $result = jl_StringBuilder_toString(var$5);
                    }
                }
            }
        }
        $this.$name = $result;
    }
    return $this.$name;
},
jl_Class_getSimpleName = $this => {
    let $metadataName, $result, var$3, var$4, $lastDollar, $lastDot;
    if (!($this.$flags & 2)) {
        $this.$flags = $this.$flags | 2;
        $metadataName = $this.$classInfo[$rt_meta].simpleName;
        $result = $metadataName === null ? null : $rt_str($metadataName);
        if ($result === null) {
            if ($this.$classInfo[$rt_meta].itemType !== null) {
                var$3 = jl_Class_getSimpleName($rt_cls($this.$classInfo[$rt_meta].itemType));
                var$4 = jl_StringBuilder__init_();
                jl_StringBuilder_append(jl_StringBuilder_append(var$4, var$3), $rt_s(38));
                $result = jl_StringBuilder_toString(var$4);
            } else if (jl_Class_getEnclosingClass($this) === null) {
                $result = jl_Class_getName($this);
                $lastDollar = $result.$lastIndexOf0(36);
                if ($lastDollar == (-1)) {
                    $lastDot = $result.$lastIndexOf0(46);
                    if ($lastDot != (-1))
                        $result = $result.$substring0($lastDot + 1 | 0);
                } else {
                    $result = $result.$substring0($lastDollar + 1 | 0);
                    if ($result.$charAt(0) >= 48 && $result.$charAt(0) <= 57)
                        $result = $rt_s(0);
                }
            } else if ($result === null)
                $result = $rt_s(0);
        }
        $this.$simpleName = $result;
    }
    return $this.$simpleName;
},
jl_Class_isPrimitive = $this => {
    return !$this.$classInfo[$rt_meta].primitiveKind ? 0 : 1;
},
jl_Class_isInterface = $this => {
    return !($this.$classInfo[$rt_meta].modifiers & 512) ? 0 : 1;
},
jl_Class_getDeclaredFields = $this => {
    let $reflection, $count, $i;
    a: {
        if ($this.$declaredFields === null) {
            $reflection = $this.$classInfo[$rt_meta].reflection;
            if ($reflection === null)
                $this.$declaredFields = $rt_createArray(jlr_Field, 0);
            else {
                $count = $reflection.fields.length;
                $this.$declaredFields = $rt_createArray(jlr_Field, $count);
                $i = 0;
                while (true) {
                    if ($i >= $count)
                        break a;
                    $this.$declaredFields.data[$i] = jlr_Field__init_0($this, $reflection.fields[$i]);
                    $i = $i + 1 | 0;
                }
            }
        }
    }
    return $this.$declaredFields.$clone0();
},
jl_Class_initialize = $this => {
    $this.$classInfo[$rt_meta].clinit();
},
jl_Class_getEnclosingClass = $this => {
    let $enclosingClass;
    $enclosingClass = $this.$classInfo[$rt_meta].enclosingClass;
    return $enclosingClass === null ? null : $rt_cls($enclosingClass);
};
$rt_packages([-1, "java", 0, "lang", 1, "reflect", -1, "org", 3, "teavm", 4, "classlib", 5, "impl", 6, "console", 5, "java", 8, "lang"
]);
$rt_metadata([jl_Object, "Object", 1, 0, [], 1, [0,0,0], 0, ["$getClass", $rt_wrapFunction0(jl_Object_getClass), "$toString", $rt_wrapFunction0(jl_Object_toString), "$identity", $rt_wrapFunction0(jl_Object_identity), "$clone0", $rt_wrapFunction0(jl_Object_clone)],
jl_Throwable, 0, jl_Object, [], 1, 0, 0, ["$fillInStackTrace", $rt_wrapFunction0(jl_Throwable_fillInStackTrace), "$getMessage", $rt_wrapFunction0(jl_Throwable_getMessage), "$getLocalizedMessage", $rt_wrapFunction0(jl_Throwable_getLocalizedMessage), "$getCause", $rt_wrapFunction0(jl_Throwable_getCause), "$toString", $rt_wrapFunction0(jl_Throwable_toString)],
jl_Exception, 0, jl_Throwable, [], 1, 0, 0, ["$_init_", $rt_wrapFunction0(jl_Exception__init_), "$_init_0", $rt_wrapFunction1(jl_Exception__init_0)],
jl_RuntimeException, "RuntimeException", 1, jl_Exception, [], 1, [0,0,0], 0, ["$_init_", $rt_wrapFunction0(jl_RuntimeException__init_), "$_init_0", $rt_wrapFunction1(jl_RuntimeException__init_0)],
jl_IndexOutOfBoundsException, "IndexOutOfBoundsException", 1, jl_RuntimeException, [], 1, [0,0,0], 0, ["$_init_", $rt_wrapFunction0(jl_IndexOutOfBoundsException__init_)],
ju_Arrays, 0, jl_Object, [], 1, 0, 0, 0,
jl_Runnable, 0, jl_Object, [], 1537, 0, 0, 0,
otcjl_TestObject, "TestObject", 9, jl_Object, [jl_Runnable], 1, [0,0,0], 0, 0,
jl_System, 0, jl_Object, [], 17, 0, 0, 0,
ji_Serializable, 0, jl_Object, [], 1537, 0, 0, 0,
jl_Number, 0, jl_Object, [ji_Serializable], 1025, 0, 0, 0,
jl_Comparable, 0, jl_Object, [], 1537, 0, 0, 0,
jl_Integer, 0, jl_Number, [jl_Comparable], 1, 0, jl_Integer_$callClinit, 0,
jl_AutoCloseable, 0, jl_Object, [], 1537, 0, 0, 0,
jl_CloneNotSupportedException, "CloneNotSupportedException", 1, jl_Exception, [], 1, [0,0,0], 0, ["$_init_", $rt_wrapFunction0(jl_CloneNotSupportedException__init_)],
jl_NullPointerException, "NullPointerException", 1, jl_RuntimeException, [], 1, [0,0,0], 0, ["$_init_", $rt_wrapFunction0(jl_NullPointerException__init_)],
jl_Character, 0, jl_Object, [jl_Comparable], 1, 0, jl_Character_$callClinit, 0,
otci_IntegerUtil, 0, jl_Object, [], 17, 0, 0, 0,
otrr_ReflectionInfo, 0, jl_Object, [], 1025, 0, 0, 0,
jl_Math, 0, jl_Object, [], 17, 0, 0, 0,
otvf_LoopExample, 0, jl_Object, [], 17, 0, otvf_LoopExample_$callClinit, 0,
jl_ReflectiveOperationException, 0, jl_Exception, [], 1, 0, 0, 0,
jl_IllegalAccessException, 0, jl_ReflectiveOperationException, [], 1, 0, 0, 0,
jl_Cloneable, 0, jl_Object, [], 1537, 0, 0, 0,
otji_JS, 0, jl_Object, [], 17, 0, 0, 0,
jl_CharSequence, 0, jl_Object, [], 1537, 0, 0, 0,
jlr_Member, 0, jl_Object, [], 1537, 0, 0, 0,
jl_StringIndexOutOfBoundsException, "StringIndexOutOfBoundsException", 1, jl_IndexOutOfBoundsException, [], 1, [0,0,0], 0, ["$_init_", $rt_wrapFunction0(jl_StringIndexOutOfBoundsException__init_0)],
ji_Closeable, 0, jl_Object, [jl_AutoCloseable], 1537, 0, 0, 0,
ji_Flushable, 0, jl_Object, [], 1537, 0, 0, 0,
ji_OutputStream, 0, jl_Object, [ji_Closeable, ji_Flushable], 1025, 0, 0, ["$_init_", $rt_wrapFunction0(ji_OutputStream__init_)],
ji_FilterOutputStream, 0, ji_OutputStream, [], 1, 0, 0, ["$_init_5", $rt_wrapFunction1(ji_FilterOutputStream__init_)],
otrr_ClassReflectionInfo, 0, otrr_ReflectionInfo, [], 17, 0, 0, 0,
otv_StepRecorder, 0, jl_Object, [], 17, 0, otv_StepRecorder_$callClinit, 0,
ju_Objects, 0, jl_Object, [], 17, 0, 0, 0,
jlr_Type, 0, jl_Object, [], 1537, 0, 0, 0,
jlr_Modifier, 0, jl_Object, [], 1, 0, jlr_Modifier_$callClinit, 0,
ju_Comparator, 0, jl_Object, [], 1537, 0, 0, 0,
jl_String$_clinit_$lambda$_118_0, "String$<clinit>$lambda$_118_0", 1, jl_Object, [ju_Comparator], 1, [0,0,0], 0, ["$_init_", $rt_wrapFunction0(jl_String$_clinit_$lambda$_118_0__init_)],
jl_AbstractStringBuilder, "AbstractStringBuilder", 1, jl_Object, [ji_Serializable, jl_CharSequence], 0, [0,0,0], 0, ["$_init_", $rt_wrapFunction0(jl_AbstractStringBuilder__init_0), "$_init_1", $rt_wrapFunction1(jl_AbstractStringBuilder__init_), "$_init_0", $rt_wrapFunction1(jl_AbstractStringBuilder__init_2), "$_init_3", $rt_wrapFunction1(jl_AbstractStringBuilder__init_1), "$append4", $rt_wrapFunction1(jl_AbstractStringBuilder_append2), "$append5", $rt_wrapFunction1(jl_AbstractStringBuilder_append), "$insert0",
$rt_wrapFunction2(jl_AbstractStringBuilder_insert), "$append6", $rt_wrapFunction1(jl_AbstractStringBuilder_append1), "$append1", $rt_wrapFunction2(jl_AbstractStringBuilder_append3), "$insert1", $rt_wrapFunction3(jl_AbstractStringBuilder_insert2), "$append7", $rt_wrapFunction1(jl_AbstractStringBuilder_append0), "$insert2", $rt_wrapFunction2(jl_AbstractStringBuilder_insert1), "$insert", $rt_wrapFunction2(jl_AbstractStringBuilder_insert0), "$ensureCapacity", $rt_wrapFunction1(jl_AbstractStringBuilder_ensureCapacity),
"$toString", $rt_wrapFunction0(jl_AbstractStringBuilder_toString), "$length", $rt_wrapFunction0(jl_AbstractStringBuilder_length), "$charAt", $rt_wrapFunction1(jl_AbstractStringBuilder_charAt)],
jl_Appendable, 0, jl_Object, [], 1537, 0, 0, 0,
jl_StringBuilder, "StringBuilder", 1, jl_AbstractStringBuilder, [jl_Appendable], 1, [0,0,0], 0, ["$_init_", $rt_wrapFunction0(jl_StringBuilder__init_2), "$_init_0", $rt_wrapFunction1(jl_StringBuilder__init_1), "$append", $rt_wrapFunction1(jl_StringBuilder_append), "$append2", $rt_wrapFunction1(jl_StringBuilder_append2), "$append3", $rt_wrapFunction1(jl_StringBuilder_append1), "$append0", $rt_wrapFunction1(jl_StringBuilder_append0), "$insert3", $rt_wrapFunction2(jl_StringBuilder_insert), "$insert4", $rt_wrapFunction2(jl_StringBuilder_insert2),
"$insert5", $rt_wrapFunction2(jl_StringBuilder_insert1), "$charAt", $rt_wrapFunction1(jl_StringBuilder_charAt), "$length", $rt_wrapFunction0(jl_StringBuilder_length), "$toString", $rt_wrapFunction0(jl_StringBuilder_toString), "$ensureCapacity", $rt_wrapFunction1(jl_StringBuilder_ensureCapacity), "$insert", $rt_wrapFunction2(jl_StringBuilder_insert3), "$insert2", $rt_wrapFunction2(jl_StringBuilder_insert0), "$insert0", $rt_wrapFunction2(jl_StringBuilder_insert4)],
jlr_AnnotatedElement, 0, jl_Object, [], 1537, 0, 0, 0,
ji_PrintStream, 0, ji_FilterOutputStream, [jl_Appendable], 1, 0, 0, ["$_init_6", $rt_wrapFunction3(ji_PrintStream__init_)],
otcic_JsConsolePrintStream, 0, ji_PrintStream, [], 1025, 0, 0, ["$_init_", $rt_wrapFunction0(otcic_JsConsolePrintStream__init_), "$println0", $rt_wrapFunction1(otcic_JsConsolePrintStream_println), "$println", $rt_wrapFunction1(otcic_JsConsolePrintStream_println0)],
otcic_JSStdoutPrintStream, "JSStdoutPrintStream", 7, otcic_JsConsolePrintStream, [], 1, [0,0,0], 0, ["$_init_", $rt_wrapFunction0(otcic_JSStdoutPrintStream__init_), "$print", $rt_wrapFunction1(otcic_JSStdoutPrintStream_print)],
jl_ClassCastException, 0, jl_RuntimeException, [], 1, 0, 0, 0,
otji_JSWrapper, 0, jl_Object, [], 17, 0, 0, 0,
otrr_DerivedClassInfo, 0, otrr_ReflectionInfo, [], 17, 0, 0, 0,
otp_Platform, 0, jl_Object, [], 17, 0, 0, 0]);
$rt_metadata([jnc_Charset, 0, jl_Object, [jl_Comparable], 1025, 0, 0, 0,
otr_StringInfo, 0, otrr_ReflectionInfo, [], 17, 0, 0, 0,
jl_Boolean, 0, jl_Object, [ji_Serializable, jl_Comparable], 1, 0, 0, 0,
jl_String, "String", 1, jl_Object, [ji_Serializable, jl_Comparable, jl_CharSequence], 1, [0,0,0], jl_String_$callClinit, ["$_init_", $rt_wrapFunction0(jl_String__init_2), "$_init_2", $rt_wrapFunction1(jl_String__init_), "$_init_7", $rt_wrapFunction1(jl_String__init_1), "$_init_4", $rt_wrapFunction3(jl_String__init_4), "$charAt", $rt_wrapFunction1(jl_String_charAt), "$length", $rt_wrapFunction0(jl_String_length), "$isEmpty", $rt_wrapFunction0(jl_String_isEmpty), "$lastIndexOf", $rt_wrapFunction2(jl_String_lastIndexOf0),
"$lastIndexOf0", $rt_wrapFunction1(jl_String_lastIndexOf), "$substring", $rt_wrapFunction2(jl_String_substring0), "$substring0", $rt_wrapFunction1(jl_String_substring), "$toString", $rt_wrapFunction0(jl_String_toString)],
jlr_GenericDeclaration, 0, jl_Object, [jlr_AnnotatedElement], 1537, 0, 0, 0,
otcic_JSStderrPrintStream, "JSStderrPrintStream", 7, otcic_JsConsolePrintStream, [], 1, [0,0,0], 0, ["$_init_", $rt_wrapFunction0(otcic_JSStderrPrintStream__init_), "$print", $rt_wrapFunction1(otcic_JSStderrPrintStream_print)],
jlr_AccessibleObject, 0, jl_Object, [jlr_AnnotatedElement], 1, 0, 0, ["$_init_", $rt_wrapFunction0(jlr_AccessibleObject__init_), "$setAccessible", $rt_wrapFunction1(jlr_AccessibleObject_setAccessible)],
otrr_FieldInfo, 0, otrr_ReflectionInfo, [], 17, 0, 0, 0,
jlr_Field, "Field", 2, jlr_AccessibleObject, [jlr_Member], 1, [0,0,0], 0, ["$_init_9", $rt_wrapFunction2(jlr_Field__init_), "$getName", $rt_wrapFunction0(jlr_Field_getName), "$getModifiers", $rt_wrapFunction0(jlr_Field_getModifiers), "$getType", $rt_wrapFunction0(jlr_Field_getType), "$toString", $rt_wrapFunction0(jlr_Field_toString), "$get", $rt_wrapFunction1(jlr_Field_get), "$getWithoutCheck", $rt_wrapFunction1(jlr_Field_getWithoutCheck), "$checkGetAccess", $rt_wrapFunction0(jlr_Field_checkGetAccess)],
jl_IllegalArgumentException, "IllegalArgumentException", 1, jl_RuntimeException, [], 1, [0,0,0], 0, ["$_init_", $rt_wrapFunction0(jl_IllegalArgumentException__init_)],
otrr_ClassInfoUtil, 0, jl_Object, [], 17, 0, 0, 0,
otrr_ClassInfo, 0, otrr_ReflectionInfo, [], 17, 0, 0, 0,
jl_Class, "Class", 1, jl_Object, [jlr_GenericDeclaration, jlr_Type], 17, [0,0,0], 0, ["$toString", $rt_wrapFunction0(jl_Class_toString), "$getClassInfo", $rt_wrapFunction0(jl_Class_getClassInfo), "$isInstance", $rt_wrapFunction1(jl_Class_isInstance), "$isAssignableFrom", $rt_wrapFunction1(jl_Class_isAssignableFrom), "$getName", $rt_wrapFunction0(jl_Class_getName), "$getSimpleName", $rt_wrapFunction0(jl_Class_getSimpleName), "$isPrimitive", $rt_wrapFunction0(jl_Class_isPrimitive), "$isInterface", $rt_wrapFunction0(jl_Class_isInterface),
"$getDeclaredFields", $rt_wrapFunction0(jl_Class_getDeclaredFields), "$initialize", $rt_wrapFunction0(jl_Class_initialize), "$getEnclosingClass", $rt_wrapFunction0(jl_Class_getEnclosingClass)]]);
$rt_reflection([
    jl_IndexOutOfBoundsException, {

    }, 
    otcjl_TestObject, {

    }, 
    jl_CloneNotSupportedException, {

    }, 
    jl_NullPointerException, {

    }, 
    jl_StringIndexOutOfBoundsException, {

    }, 
    jl_String$_clinit_$lambda$_118_0, {

    }, 
    jl_StringBuilder, {

    }, 
    otcic_JSStdoutPrintStream, {

    }, 
    jl_AbstractStringBuilder, {

    }, 
    jl_String, {

    }, 
    otcic_JSStderrPrintStream, {

    }, 
    jl_RuntimeException, {

    }, 
    jlr_Field, {

    }, 
    jl_IllegalArgumentException, {

    }, 
    jl_Object, {

    }, 
    jl_Class, {

    }]);
let $rt_charArrayCls = $rt_arraycls($rt_charcls),
$rt_intArrayCls = $rt_arraycls($rt_intcls);
$rt_stringPool(["", ": ", "0", "org.teavm.visualizer.fixture.LoopExample", "sumTo", "n", "sum", "i", "main", "args", "null", "@", ":", "{", ",", "=", "}", "\u0000VIZ:step", "\u0000VIZ:var:", "\u0000VIZ:truncated", "default", "public", "protected", "private", "abstract", "static", "final", "transient", "volatile", "synchronized", "native", "strictfp", "interface", "\n", ".", "interface ", "class ", "[L", "[]"]);
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
let $rt_export_main = $rt_mainStarter(otvf_LoopExample_main);
$rt_export_main.javaException = $rt_javaException;
$rt_exports.main = $rt_export_main;
}));

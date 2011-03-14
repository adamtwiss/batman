Batman.ready(function() {
    
    module('$binding');
    
    test('returns a function', function() {
        equal(typeof $binding(), 'function', 'binding is a function');
    });
    
    test('getting value', function() {
        var binding = $binding('foo');
        equal(binding(), 'foo', 'calling binding function returns value');
    });
    
    test('setting value', function() {
        var binding = $binding();
        binding('foo');
        
        equal(binding(), 'foo', 'calling binding function with a value sets that value');
    });
    
    test('computed binding', function() {
        var obj = {foo: 'bar'};
        
        equal($binding(function() { return obj.foo; })(), 'bar', 'returns simple value');
        equal($binding(function() { return this.foo; }.bind(obj))(), 'bar', 'computed function context');
        
        var obj2 = Batman({
            foo: $binding('foobar'),
            bar: $binding('baz'),
            
            binding: $binding(function() {
                return this.foo() + this.bar();
            })
        });
        
        equal(obj2.binding(), 'foobarbaz', 'context was correct on mixed in binding');
    });
    
    module('Batman.Binding');
    
    test('observing', 4, function() {
        var binding = $binding('foo');
        binding.observe(function(value) {
            equal(value, 'bar', 'observer called with new value');
            strictEqual(this, Batman, 'context is Batman by default');
        });
        
        binding('bar');
        
        binding.observe(function(value) {
            equal(value, 'bar', 'second binding called immediately');
        }, true)
        
        var obj = Batman({
            foo: $binding('bar')
        });
        
        var f = function() {
            strictEqual(this, obj, 'context is correct on mixed in binding');
        };
        
        obj.foo.observe(f).observe(f); // make sure that the observer doesn't get added twice
        obj.foo.fire();
    });
    
    test('stop observing', 1, function() {
        var obj = Batman({
            foo: $binding('bar')
        });
        
        var f = function() {
            ok(true, 'observer fired');
        };
        
        obj.foo.observe(f).fire();
        obj.foo.forget(f).fire();
    });
    
    test('computed dependencies', 2, function() {
        // Not on a mixin
        var foo = $binding('foo'),
            bar = $binding('bar'),
            baz = $binding(function() {
                return foo() + bar();
            });
        
        baz.observe(function(value) {
            equal(value, 'foobarbar', 'computed binding updated');
        });
        
        baz.observeDependencies();
        bar('barbar');
        
        // On a mixin
        var obj = Batman({
            foo: $binding('foo'),
            bar: $binding('bar'),
            
            baz: $binding(function() {
                return this.foo() + this.bar();
            })
        });
        
        obj.baz.observe(function(value) {
            equal(value, 'foobarbar', 'computed binding through mixin updated');
        });
        
        obj.bar('barbar');
    });
    
    test('logging', function() {
        var binding = $binding('foo');
        equal(binding.toString(), 'binding: foo', 'toString() returns value with debug info');
        equal(binding.toObject().value, 'foo', 'toObject() returns an object version of the binding');
    });
    
    test('keys from value', 2, function() {
        var binding = $binding([]);
        binding.observe(function() {
            ok(true, 'observer fired');
        });
        
        binding.push(1);
        equal(binding.count(), 1, 'count binding is correct')
    });
    
    test('prevent and allow', function() {
        var binding = $binding().observe(function(){ ok(shouldFire, 'observer fired'); }),
            shouldFire = false;
        
        binding.prevent();
        binding.fire();
        equal(binding.allowed(), false, 'binding is prevented');
        
        binding.prevent();
        binding.fire();
        
        binding.allow();
        binding.fire();
        
        shouldFire = true;
        binding.allow();
        binding.fire();
        equal(binding.allowed(), true, 'binding is allowed');
    });
    
    test('validations', function() {
        var validator = function(newValue, oldValue) {
            ok(newValue == 'foo' || newValue == 'bar', 'new value is correct: ' + newValue);
            ok(!oldValue || oldValue == 'foo', 'old value is correct: ' + oldValue);
            return 'bar';
        };
        
        var binding = $binding('foo').validate(validator, true);
        equal(binding(), 'bar', 'return from validator sets binding');
        
        binding.forgetValidator(validator);
        equal(binding('foo'), 'foo', 'validator is removed');
    });
    
});
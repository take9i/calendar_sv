
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.17.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function _isPlaceholder(a) {
           return a != null && typeof a === 'object' && a['@@functional/placeholder'] === true;
    }

    /**
     * Optimized internal one-arity curry function.
     *
     * @private
     * @category Function
     * @param {Function} fn The function to curry.
     * @return {Function} The curried function.
     */
    function _curry1(fn) {
      return function f1(a) {
        if (arguments.length === 0 || _isPlaceholder(a)) {
          return f1;
        } else {
          return fn.apply(this, arguments);
        }
      };
    }

    /**
     * Optimized internal two-arity curry function.
     *
     * @private
     * @category Function
     * @param {Function} fn The function to curry.
     * @return {Function} The curried function.
     */
    function _curry2(fn) {
      return function f2(a, b) {
        switch (arguments.length) {
          case 0:
            return f2;
          case 1:
            return _isPlaceholder(a) ? f2 : _curry1(function (_b) {
              return fn(a, _b);
            });
          default:
            return _isPlaceholder(a) && _isPlaceholder(b) ? f2 : _isPlaceholder(a) ? _curry1(function (_a) {
              return fn(_a, b);
            }) : _isPlaceholder(b) ? _curry1(function (_b) {
              return fn(a, _b);
            }) : fn(a, b);
        }
      };
    }

    function _isNumber(x) {
      return Object.prototype.toString.call(x) === '[object Number]';
    }

    /**
     * Returns a list of numbers from `from` (inclusive) to `to` (exclusive).
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig Number -> Number -> [Number]
     * @param {Number} from The first number in the list.
     * @param {Number} to One more than the last number in the list.
     * @return {Array} The list of numbers in the set `[a, b)`.
     * @example
     *
     *      R.range(1, 5);    //=> [1, 2, 3, 4]
     *      R.range(50, 53);  //=> [50, 51, 52]
     */
    var range = /*#__PURE__*/_curry2(function range(from, to) {
      if (!(_isNumber(from) && _isNumber(to))) {
        throw new TypeError('Both arguments to range must be numbers');
      }
      var result = [];
      var n = from;
      while (n < to) {
        result.push(n);
        n += 1;
      }
      return result;
    });

    /* src/Year.svelte generated by Svelte v3.17.1 */

    const file = "src/Year.svelte";

    function create_fragment(ctx) {
    	let div1;
    	let h5;
    	let t0_value = `${/*year*/ ctx[0]}(${/*year*/ ctx[0] - /*birthYear*/ ctx[1]})` + "";
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let hr;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h5 = element("h5");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			t2 = space();
    			hr = element("hr");
    			attr_dev(h5, "class", "yheader svelte-17ovcc");
    			add_location(h5, file, 13, 2, 147);
    			add_location(div0, file, 14, 2, 207);
    			add_location(hr, file, 17, 2, 237);
    			add_location(div1, file, 12, 0, 139);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h5);
    			append_dev(h5, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			append_dev(div1, t2);
    			append_dev(div1, hr);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*year, birthYear*/ 3) && t0_value !== (t0_value = `${/*year*/ ctx[0]}(${/*year*/ ctx[0] - /*birthYear*/ ctx[1]})` + "")) set_data_dev(t0, t0_value);

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[2], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { year } = $$props;
    	let { birthYear } = $$props;
    	const writable_props = ["year", "birthYear"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Year> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("year" in $$props) $$invalidate(0, year = $$props.year);
    		if ("birthYear" in $$props) $$invalidate(1, birthYear = $$props.birthYear);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { year, birthYear };
    	};

    	$$self.$inject_state = $$props => {
    		if ("year" in $$props) $$invalidate(0, year = $$props.year);
    		if ("birthYear" in $$props) $$invalidate(1, birthYear = $$props.birthYear);
    	};

    	return [year, birthYear, $$scope, $$slots];
    }

    class Year extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { year: 0, birthYear: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Year",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*year*/ ctx[0] === undefined && !("year" in props)) {
    			console.warn("<Year> was created without expected prop 'year'");
    		}

    		if (/*birthYear*/ ctx[1] === undefined && !("birthYear" in props)) {
    			console.warn("<Year> was created without expected prop 'birthYear'");
    		}
    	}

    	get year() {
    		throw new Error("<Year>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set year(value) {
    		throw new Error("<Year>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get birthYear() {
    		throw new Error("<Year>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set birthYear(value) {
    		throw new Error("<Year>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /*!
     * calendar.js: inspired by the calendar module from Python
     * Copyright(c) 2011 Luciano Ramalho <luciano@ramalho.org>
     * MIT Licensed
     */

    // exports.version = '0.1.0';

    var CalendarException = function CalendarException(message) {
       this.message = message;
       this.toString = function() {
          return this.constructor.name + ": " + this.message
       };
    };

    var Calendar = function Calendar(firstWeekDay) {
        //properties
        this.firstWeekDay = firstWeekDay || 0; // 0 = Sunday
    };

    Calendar.prototype = {
        constructor : Calendar,
        weekStartDate : function weekStartDate(date) {
            var startDate = new Date(date.getTime());
            while (startDate.getDay() !== this.firstWeekDay) {
                startDate.setDate(startDate.getDate() - 1);
            }
            return startDate;
        },
        monthDates : function monthDates(year, month, dayFormatter, weekFormatter) {
            if ((typeof year !== "number") || (year < 1970)) {
                throw new CalendarException('year must be a number >= 1970');
            }        if ((typeof month !== "number") || (month < 0) || (month > 11)) {
                throw new CalendarException('month must be a number (Jan is 0)');
            }        var weeks = [],
                week = [],
                i = 0,
                date = this.weekStartDate(new Date(year, month, 1));
            do {
                for (i=0; i<7; i++) {
                    week.push(dayFormatter ? dayFormatter(date) : date);
                    date = new Date(date.getTime());
                    date.setDate(date.getDate() + 1);
                }
                weeks.push(weekFormatter ? weekFormatter(week) : week);
                week = [];
            } while ((date.getMonth()<=month) && (date.getFullYear()===year));
            return weeks;
        },
        monthDays : function monthDays(year, month) {
            var getDayOrZero = function getDayOrZero(date) {
                return date.getMonth() === month ? date.getDate() : 0;
            };
            return this.monthDates(year, month, getDayOrZero);
        },
        monthText : function monthText(year, month) {
            if (typeof year === "undefined") {
                var now = new Date();
                year = now.getFullYear();
                month = now.getMonth();
            }        var getDayOrBlank = function getDayOrBlank(date) {
                var s = date.getMonth() === month ? date.getDate().toString() : "  ";
                while (s.length < 2) s = " "+s;
                return s;
            };
            var weeks = this.monthDates(year, month, getDayOrBlank,
                function (week) { return week.join(" ") });
            return weeks.join("\n");
        }
    };
    var months = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split(" ");
    for (var i=0; i<months.length; i++)
        Calendar[months[i]] = i;

    /* src/Month.svelte generated by Svelte v3.17.1 */
    const file$1 = "src/Month.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (63:10) {:else}
    function create_else_block(ctx) {
    	let td;

    	const block = {
    		c: function create() {
    			td = element("td");
    			add_location(td, file$1, 63, 12, 1330);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(63:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (55:10) {#if day != 0}
    function create_if_block(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*i*/ ctx[10] == 5) return create_if_block_1;
    		if (show_if == null || dirty & /*year, month*/ 3) show_if = !!(/*i*/ ctx[10] == 6 || /*isHoliday*/ ctx[3](/*day*/ ctx[8]));
    		if (show_if) return create_if_block_2;
    		if (/*day*/ ctx[8] != 0) return create_if_block_3;
    	}

    	let current_block_type = select_block_type_1(ctx, -1);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(55:10) {#if day != 0}",
    		ctx
    	});

    	return block;
    }

    // (60:31) 
    function create_if_block_3(ctx) {
    	let td;
    	let t_value = /*day*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "align", "right");
    			add_location(td, file$1, 60, 14, 1253);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*year, month*/ 3 && t_value !== (t_value = /*day*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(60:31) ",
    		ctx
    	});

    	return block;
    }

    // (58:47) 
    function create_if_block_2(ctx) {
    	let td;
    	let t_value = /*day*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "align", "right");
    			attr_dev(td, "class", "sunday svelte-1rzaf6z");
    			add_location(td, file$1, 58, 14, 1163);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*year, month*/ 3 && t_value !== (t_value = /*day*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(58:47) ",
    		ctx
    	});

    	return block;
    }

    // (56:12) {#if i == 5}
    function create_if_block_1(ctx) {
    	let td;
    	let t_value = /*day*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "align", "right");
    			attr_dev(td, "class", "saturday svelte-1rzaf6z");
    			add_location(td, file$1, 56, 14, 1055);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*year, month*/ 3 && t_value !== (t_value = /*day*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(56:12) {#if i == 5}",
    		ctx
    	});

    	return block;
    }

    // (54:8) {#each week as day, i}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*day*/ ctx[8] != 0) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(54:8) {#each week as day, i}",
    		ctx
    	});

    	return block;
    }

    // (52:4) {#each cal.monthDays(year, month) as week}
    function create_each_block(ctx) {
    	let tr;
    	let t;
    	let each_value_1 = /*week*/ ctx[5];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(tr, file$1, 52, 6, 955);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cal, year, month, isHoliday*/ 15) {
    				each_value_1 = /*week*/ ctx[5];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(52:4) {#each cal.monthDays(year, month) as week}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let table;
    	let t0;
    	let h1;
    	let t1_value = /*month*/ ctx[1] + 1 + "";
    	let t1;
    	let each_value = /*cal*/ ctx[2].monthDays(/*year*/ ctx[0], /*month*/ ctx[1]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			h1 = element("h1");
    			t1 = text(t1_value);
    			attr_dev(table, "class", "mtable svelte-1rzaf6z");
    			add_location(table, file$1, 50, 2, 879);
    			attr_dev(h1, "class", "mbg svelte-1rzaf6z");
    			add_location(h1, file$1, 69, 2, 1406);
    			attr_dev(div, "class", "month svelte-1rzaf6z");
    			add_location(div, file$1, 49, 0, 857);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, table);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, h1);
    			append_dev(h1, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cal, year, month, isHoliday*/ 15) {
    				each_value = /*cal*/ ctx[2].monthDays(/*year*/ ctx[0], /*month*/ ctx[1]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*month*/ 2 && t1_value !== (t1_value = /*month*/ ctx[1] + 1 + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { year } = $$props;
    	let { month } = $$props;
    	let { date2Holiday } = $$props;
    	const cal = new Calendar();

    	const isHoliday = day => {
    		const k = `${year}/${month + 1}/${day}`;
    		return k in date2Holiday;
    	};

    	const writable_props = ["year", "month", "date2Holiday"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Month> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("year" in $$props) $$invalidate(0, year = $$props.year);
    		if ("month" in $$props) $$invalidate(1, month = $$props.month);
    		if ("date2Holiday" in $$props) $$invalidate(4, date2Holiday = $$props.date2Holiday);
    	};

    	$$self.$capture_state = () => {
    		return { year, month, date2Holiday };
    	};

    	$$self.$inject_state = $$props => {
    		if ("year" in $$props) $$invalidate(0, year = $$props.year);
    		if ("month" in $$props) $$invalidate(1, month = $$props.month);
    		if ("date2Holiday" in $$props) $$invalidate(4, date2Holiday = $$props.date2Holiday);
    	};

    	return [year, month, cal, isHoliday, date2Holiday];
    }

    class Month extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { year: 0, month: 1, date2Holiday: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Month",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*year*/ ctx[0] === undefined && !("year" in props)) {
    			console.warn("<Month> was created without expected prop 'year'");
    		}

    		if (/*month*/ ctx[1] === undefined && !("month" in props)) {
    			console.warn("<Month> was created without expected prop 'month'");
    		}

    		if (/*date2Holiday*/ ctx[4] === undefined && !("date2Holiday" in props)) {
    			console.warn("<Month> was created without expected prop 'date2Holiday'");
    		}
    	}

    	get year() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set year(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get month() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set month(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get date2Holiday() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date2Holiday(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.17.1 */

    const { Object: Object_1 } = globals;
    const file$2 = "src/App.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (38:2) {#if date2Holiday}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = range(/*birthYear*/ ctx[0] + /*page*/ ctx[1] * 10, /*birthYear*/ ctx[0] + /*page*/ ctx[1] * 10 + 10);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*R, birthYear, page, date2Holiday*/ 7) {
    				each_value = range(/*birthYear*/ ctx[0] + /*page*/ ctx[1] * 10, /*birthYear*/ ctx[0] + /*page*/ ctx[1] * 10 + 10);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(38:2) {#if date2Holiday}",
    		ctx
    	});

    	return block;
    }

    // (41:8) {#each R.range(0, 12) as month}
    function create_each_block_1$1(ctx) {
    	let current;

    	const month = new Month({
    			props: {
    				year: /*year*/ ctx[4],
    				month: /*month*/ ctx[7],
    				date2Holiday: /*date2Holiday*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(month.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(month, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const month_changes = {};
    			if (dirty & /*birthYear, page*/ 3) month_changes.year = /*year*/ ctx[4];
    			if (dirty & /*date2Holiday*/ 4) month_changes.date2Holiday = /*date2Holiday*/ ctx[2];
    			month.$set(month_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(month.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(month.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(month, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(41:8) {#each R.range(0, 12) as month}",
    		ctx
    	});

    	return block;
    }

    // (40:6) <Year {year} {birthYear}>
    function create_default_slot(ctx) {
    	let t;
    	let current;
    	let each_value_1 = range(0, 12);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*R, birthYear, page, date2Holiday*/ 7) {
    				each_value_1 = range(0, 12);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(40:6) <Year {year} {birthYear}>",
    		ctx
    	});

    	return block;
    }

    // (39:4) {#each R.range(birthYear + page * 10, birthYear + page * 10 + 10) as year}
    function create_each_block$1(ctx) {
    	let current;

    	const year = new Year({
    			props: {
    				year: /*year*/ ctx[4],
    				birthYear: /*birthYear*/ ctx[0],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(year.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(year, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const year_changes = {};
    			if (dirty & /*birthYear, page*/ 3) year_changes.year = /*year*/ ctx[4];
    			if (dirty & /*birthYear*/ 1) year_changes.birthYear = /*birthYear*/ ctx[0];

    			if (dirty & /*$$scope, birthYear, page, date2Holiday*/ 1031) {
    				year_changes.$$scope = { dirty, ctx };
    			}

    			year.$set(year_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(year.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(year.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(year, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(39:4) {#each R.range(birthYear + page * 10, birthYear + page * 10 + 10) as year}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let current;
    	let dispose;
    	let if_block = /*date2Holiday*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			attr_dev(main, "class", "svelte-18j0wwb");
    			add_location(main, file$2, 36, 0, 771);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			current = true;
    			dispose = listen_dev(window, "keyup", /*handleKeyup*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*date2Holiday*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { birthYear } = $$props;
    	let page = 4;
    	let date2Holiday;

    	const handleKeyup = event => {
    		if (event.key == "ArrowLeft") {
    			$$invalidate(1, page = page - 1);
    		} else if (event.key == "ArrowRight") {
    			$$invalidate(1, page = page + 1);
    		}
    	};

    	onMount(async () => {
    		const res = await fetch("./holidays.json");
    		const holidays = await res.json();
    		$$invalidate(2, date2Holiday = Object.fromEntries(holidays.map(holiday => [holiday.id, holiday.name])));
    	});

    	const writable_props = ["birthYear"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("birthYear" in $$props) $$invalidate(0, birthYear = $$props.birthYear);
    	};

    	$$self.$capture_state = () => {
    		return { birthYear, page, date2Holiday };
    	};

    	$$self.$inject_state = $$props => {
    		if ("birthYear" in $$props) $$invalidate(0, birthYear = $$props.birthYear);
    		if ("page" in $$props) $$invalidate(1, page = $$props.page);
    		if ("date2Holiday" in $$props) $$invalidate(2, date2Holiday = $$props.date2Holiday);
    	};

    	return [birthYear, page, date2Holiday, handleKeyup];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { birthYear: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*birthYear*/ ctx[0] === undefined && !("birthYear" in props)) {
    			console.warn("<App> was created without expected prop 'birthYear'");
    		}
    	}

    	get birthYear() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set birthYear(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		birthYear: 1971
    	}
    });

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');

    return app;

}());
//# sourceMappingURL=bundle.js.map

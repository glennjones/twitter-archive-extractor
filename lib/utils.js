
'use strict';

module.exports = {

	// trim whitespace from text
	trim: function ( str ) {
		return str.replace(/^\s+|\s+$/g, '');
	},

	// very simple clone method
	clone: function ( obj ){
		return JSON.parse(JSON.stringify( obj ) )
	},

	isArray: function (obj) {
	    return obj && !(obj.propertyIsEnumerable('length')) 
	        && typeof obj === 'object' 
	        && typeof obj.length === 'number';
	},

	isString: function (obj) {
    	return typeof (obj) == 'string';
	},

	sortObjectsByProperty: function(a, field, reverse, primer) {
    	return a.sort( this.sortObjects(field, reverse, primer) );
	},


	sortObjects: function (field, reverse, primer) {
	    reverse = (reverse) ? -1 : 1;
	    return function (a, b) {
	        a = a[field];
	        b = b[field];
	        if (primer !== undefined && a !== undefined && b !== undefined) {
	            a = primer(a);
	            b = primer(b);
	        }
	        if (a < b) return reverse * -1;
	        if (a > b) return reverse * 1;
	        return 0;
	    }
	}

};

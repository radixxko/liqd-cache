'use strict';

const assert = require('assert' );

const time_ms = () => (new Date()).getTime();

const Cache = require('../../lib/cache');

describe('- cache', function()
{
	it('should cache data', function( done )
	{
		let cache = new Cache();

		assert.ok( cache.get( 'foo' ) === undefined );
		assert.ok( cache.set( 'foo', 'bar' ) === cache );
		assert.ok( cache.get( 'foo' ) === 'bar' );

		assert.ok( cache.get( 'foo2' ) === undefined );
		assert.ok( cache.set( 'foo2', 'bar2', Infinity, ( id, data ) =>
		{
			assert.ok( id === 'foo2' && data === 'bar2' );
			assert.ok( cache.size === 0 );

			setTimeout( done, 100 );
		}) === cache );
		assert.ok( cache.get( 'foo2', 100 ) === 'bar2' );

		assert.ok( cache.get( 'foo' ) === 'bar' );

		assert.deepStrictEqual( [ 'foo', 'foo2' ], Array.from(cache.keys()) );
		assert.ok( cache.size === 2 );

		assert.ok( cache.delete('bar') === undefined );
		assert.ok( cache.size === 2 );

		assert.ok( cache.delete('foo') === 'bar' );
		assert.ok( cache.size === 1 );
		assert.ok( cache.delete('foo') === undefined );

		assert.deepStrictEqual( [ 'foo2' ], Array.from(cache.keys()) );
		assert.ok( cache.delete('foo2') === 'bar2' );
	});

	it('should cache data with timeout', function( done )
	{
		let cache = new Cache();
		let start = time_ms();

		assert.ok( cache.get( 'foo' ) === undefined );
		assert.ok( cache.set( 'foo', 'bar', 100 ) === cache );
		assert.ok( cache.get( 'foo' ) === 'bar' );

		assert.ok( cache.get( 'foo2' ) === undefined );
		assert.ok( cache.set( 'foo2', 'bar2', 400, ( id, data ) =>
		{
			let now = time_ms();

			assert.ok( id === 'foo2' && data === 'bar2' );
			assert.ok( cache.size === 1 );

			assert.ok( start + 500 < now + 50 && start + 500 > now - 50 );

			setTimeout( done, 100 );
		}) === cache );
		assert.ok( cache.get( 'foo2' ) === 'bar2' );

		assert.ok( cache.set( 'foo3', 'bar3', 300 ) === cache );
		assert.ok( cache.set( 'foo4', 'bar4', 50 ) === cache );

		assert.ok( cache.get( 'foo' ) === 'bar' );
		assert.ok( cache.get( 'foo2' ) === 'bar2' );
		assert.ok( cache.get( 'foo3' ) === 'bar3' );
		assert.ok( cache.get( 'foo4' ) === 'bar4' );

		assert.deepStrictEqual( [ 'foo', 'foo2', 'foo3', 'foo4' ], Array.from(cache.keys()) );
		assert.ok( cache.size === 4 );

		assert.ok( cache.set( 'foo4', 'bar4.4', 100 ) === cache );
		assert.ok( cache.get( 'foo4' ) === 'bar4.4' );
		assert.deepStrictEqual( [ 'foo', 'foo2', 'foo3', 'foo4' ], Array.from(cache.keys()) );
		assert.ok( cache.size === 4 );

		setTimeout( () =>
		{
			assert.ok( cache.size === 2 );
			assert.ok( cache.delete('foo') === undefined );
			assert.ok( cache.size === 2 );

			assert.ok( cache.get('foo', 100) === undefined );
			assert.ok( cache.get( 'foo2', 300 ) === 'bar2' );

			assert.ok( cache.size === 2 );

			assert.ok( cache.set( 'foo3', 'bar3' ) === cache );
			assert.ok( cache.get( 'foo3' ) === 'bar3' );
		},
		200 );
	});

	it('should survive weird cases', function( done )
	{
		let cache = new Cache();

		cache._expire('not_present');
		cache.set('foo', 'bar');
		cache._expire('foo');
		cache.set('foo', 'bar', 100);
		cache._expire('foo');

		setTimeout( done, 250 );
	});

	it('should not trigger expire', function( done )
	{
		let cache = new Cache();

		cache.set('foo', 'bar', 1000, assert.fail );
		cache.delete('foo', false);

		setTimeout( done, 250 );
	});
});

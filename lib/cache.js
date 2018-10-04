'use strict';

const Timer = require('liqd-timer');

module.exports = class Cache
{
	// TODO pridat do options timeout(default)
	constructor( options = {} )
	{
		this.cache = new Map();
		this.timer = null;
	}

	set( id, data, timeout = Infinity, expire_callback = null )
	{
		this.cache.set( id, { data, expire_callback });

		if( timeout && timeout < Infinity )
		{
			if( !this.timer ){ this.timer = new Timer(); }

			if( !this.timer.postpone( id, timeout ) )
			{
				this.timer.set( id, this._expire.bind( this, id ), timeout );
			}
		}
		else if( this.timer )
		{
			this.timer.clear( id );
		}

		return this;
	}

	get( id, refresh_timeout = 0 )
	{
		let item = this.cache.get( id );

		if( item && refresh_timeout && this.timer )
		{
			this.timer.postpone( id, refresh_timeout );
		}

		return item ? item.data : undefined;
	}

	_expire( id )
	{
		let item = this.cache.get( id );

		if( item )
		{
			this.cache.delete( id );

			if( this.timer ){ this.timer.clear( id ); }

			if( item.expire_callback )
			{
				item.expire_callback( id, item.data );
			}
		}
	}

	delete( id, expire = true )
	{
		let item = this.cache.get( id );

		if( item )
		{
			this.cache.delete( id );

			if( item.expire_callback && expire )
			{
				item.expire_callback( id,item.data );
			}
		}

		return item ? item.data : undefined;
	}

	get size()
	{
		return this.cache.size;
	}

	keys()
	{
		return this.cache.keys();
	}
}

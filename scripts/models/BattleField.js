/*global klass, Tile, Entity, EntityPool, Layer, utils, window, document */

var BattleField = klass({

	tileSize: 0,
	scaledTileSize: 0,
	screenWidth: 0,
	screenHeight: 0,
	width: 10,					// amount of squares in X orientation
	height: 10,					// amout of squres in Y orientation
	mapMaxSize: 18,				// max size for width and height
	mapMinSize: 12,				// min size for width and height
	offsetX: 430,				// to store de original values of the first Tile 0,0
	offsetY: 150,				// to store de original values of the first Tile 0,0
	translatedX: 0,				// store the move on x-axis
	translatedY: 0,				// store the move on y-axis
	dx: 0,						// translation x to start a draw the map 
	dy: 0,						// translation y to start a draw the map 
	totalPlayableTiles: 0,
	serverMap: false,			// check if the map was generated by the server
	map: [],
	_forceRender: true,

	context: null,
	resources: null,

	frameCount: 0,

	layer: null,

	objectsPool: "",
	tilesPool: "",

	// DEBUG
	_mapColorType: false,
	_mapCartesianCoordinates: false,

	initialize: function (configs) {
		if (configs) {
			Object.extend(this, configs);
		}


		this.objectsPool = new EntityPool();
		this.tilesPool = new TilePool();

		this.layer = new Layer({zIndex: 1, isometric: false, name: "battlefield"});
		this.context = this.layer.getContext();

		this.debugMode(true);
		this.generateArena();
		utils.addListener(window, 'resize', this.forceRender.bind(this))
	},

	generateArena: function () {

		var width = this.width,
			height = this.height, 
			mapSize = width * height,
			minPlayableTiles = 60,
			i = true;

		minPlayableTiles = Math.floor(minPlayableTiles * mapSize / 100);

		this.dx += this.translatedX;
		this.dy += this.translatedY;

		while (i) {
			this.createMapDimensions();
			this.totalPlayableTiles = this.generatePlayableArena();

			if (this.totalPlayableTiles > minPlayableTiles) {
				i = false;
			}
		}

		// this.generateRelief();
		this.setNonWalkableTiles();
		this.forceRender();
	},

	createMapDimensions: function () {
		var maxSize = this.mapMaxSize,
			minSize = this.mapMinSize,
			tile,
			y,
			x;

		this.width = Math.floor(Math.random() * (maxSize - minSize + 1) + minSize);
		this.height = Math.floor(Math.random() * (maxSize - minSize + 1) + minSize);


		this._createMapArray();

		this.offsetX = (this.screenWidth / 2) + (this.height - this.width) *  (this.scaledTileSize / 2);
		this.offsetY = (this.screenHeight / 2) - ((this.scaledTileSize / 2 * this.height) + (this.width - this.height) * this.scaledTileSize / 4);

		this.dx = this.offsetX + this.translatedX;
		this.dy = this.offsetY + this.translatedY;
	},

		// setup the map array
	_createMapArray: function () {
		var terrainCount = this.resources.type.terrain.length;

		this.tilesPool.reset();

		this.map = new Array(this.height);
		
		for (y = this.height - 1; y >= 0; y--) {
			this.map[y] = new Array(this.height);
			for (x = this.width - 1; x >= 0; x--) {

				this._createTile(x, y, terrainCount);

			}
		}
	},

	_createTile: function (x, y, terrainCount) {
		var index = Math.floor(Math.random() * terrainCount);

		var tile = {
			x: x,
			y: y,
			elevation: 0,
			type: 0,
			terrain: this.resources.type.terrain[index],
			subsoil: this.resources.type.subsoil[index],
			underground: 'underground-grass1',
			scaledTileSize: this.scaledTileSize
		};

		this.map[y][x] = this.tilesPool.getTile();
		this.map[y][x].extend(tile);
	},

	/**
	 * Defines tiles that can be walkable for characters.
	 * @return {integer} total of walkable tiles.
	 */
	generatePlayableArena: function () {

		var centerX = Math.floor((this.width - 1) / 2), // getting the central point in the arena
			centerY = Math.floor((this.height - 1) / 2),
			TotalTiles = this.width * this.height,
			ArenaPerCent = Math.floor(80 * TotalTiles / 100),
			tilePos,
			totalNeighborTiles,
			maxLoop = 0,
			tiles = 9,
			i,
			j;

		// setting a starting point in the map to create a route of common terrain to escape.
		for (i = 2; i >= 0; i--) {
			for (j = 2; j >= 0; j--) {
				this.map[centerY + (i - 1)][centerX + (j - 1)].type = 1; // verificar se existe essa posicao
				ArenaPerCent--;
			}
		}

		i = ArenaPerCent;

		while (i && tiles <= ArenaPerCent) {

			tilePos = this.getARandomMapPosition();

			totalNeighborTiles = this.findTotalWalkableNeighbors(tilePos.x, tilePos.y);
			if (totalNeighborTiles === 3) {
				tiles++;
				i--;
				maxLoop = 0;
				this.map[tilePos.y][tilePos.x].type = 1;
			} else {
				maxLoop++;
			}

			if (maxLoop > 100) {
				i = 0;
			}
		}

		return tiles;
	},

	/**
	 * Returns a position that has three neighbor tiles with type = 1
	 */
	findTotalWalkableNeighbors: function (x, y) {
		var neighborAmount = 0,
			map = this.map,
			i,
			j;

		for (i = 2; i >= 0; i--) {
			for (j = 2; j >= 0; j--) {
				if (map[y + (i - 1)] &&
				    map[y + (i - 1)][x + (j - 1)] &&
				    map[y + (i - 1)][x + (j - 1)].type === 1) {
					neighborAmount++;
				}
			}
		}

		return neighborAmount;
	},

	/**
	 * Returns a random x and y position of the battlefield.
	 * @return {object} 
	 */
	getARandomMapPosition: function () {
		var x,
			y,
			i = true,
			continueSearching = true,
			width = this.width,
			height = this.height;


		while (i) {
			x = Math.round(Math.random() * width);
			y = Math.round(Math.random() * height);

			x = x > (width - 1) ? x - 1 : x;
			y = y > (height - 1) ? y - 1 : y;


			if (this.map[y][x].type === 0 || this.map[y][x].type === null) {
				return {
					x: x,
					y: y
				};
			}
		}
	},

	/**
	 * Sets tiles that characters cannot walk.
	 * This tiles can be used to place Resources.
	 */
	setNonWalkableTiles: function () {
		var i,
			pos,
			tile,
			index,
			object,
			nonWalkable = this.resources.type.nonWalkable,
			totalResources = nonWalkable.length,
			resources = this.resources.elems,
			amount = this.resources.type.amount;

		this.objectsPool.reset();

		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
		// encapsular em uma funcao pois isso nao eh obrigatorio caso o mapa venha todo definido do servidor.
		for (i =  amount - 1; i >= 0; i--) {

			index = Math.floor(Math.random() * totalResources);
			pos = this.getARandomMapPosition();

			var object = this.objectsPool.getEntity();
			tile = this.map[pos.y][pos.x];

			object.setImage(resources[nonWalkable[index]]);
			object.setCoordinates(pos.x, pos.y);
			object.calculate(this.dx, this.dy, this.scaledTileSize);

			tile.type = 5; // that is right!
		}

		// this.setSpecialWalkableTiles();
	},

	/**
	 * Sets tiles that characters walk affected by some type of effect.
	 * This tiles can be used to place that can coxists with characters.
	 */
	setSpecialWalkableTiles: function () {
		var map = this.map,
			width = this.width,
			height = this.height,
			x,
			y;

		for (y = height - 1; y >= 0; y--) {
			for (x = width - 1; x >= 0; x--) {
				if (map[y][x].type === 0) {
					map[y][x].type = 6;
				}
			}
		}
	},

	/**
	 * Place the resources images into the battleField
	 * @return {void}
	 */
	renderStaticObjects: function () {
		var amount = this.resources.type.amount,
			object,
			i;

		for (i = 0; i < amount; i++) {
			object = this.objectsPool._entityPool[i];
			object.setElevationOffset(this.map[object.coordY][object.coordX].elevationOffset);
			object.calculate(this.dx, this.dy, this.scaledTileSize);
			object.forceRender();
		}
	},

	/**
	 * Renders the terrain of the map, this includes water too.
	 * @return {[type]} [description]
	 */
	renderTerrain: function () {
		var width = this.width,
			height = this.height,
			context = this.context;

		this.layer.clear();
		Tile.render(context, this.map, this.resources, this.tileSize, width, height, this.dx, this.dy);


		this.layer.save();
		this.layer.translate(this.dx, this.dy);
		this.layer.isometricMode();

		if (this._mapColorType)
			Tile.renderColorType(context, this.map, this.tileSize, width, height);
		if (this._mapCartesianCoordinates)
			Tile.renderPositions(context, this.tileSize, width, height);

		Tile.renderBorders(context, this.tileSize, width, height);
		this.layer.restore();

	},

	render: function (frame) {
		this.frameCount = frame;
		if (this._forceRender) {
			this.renderTerrain();
			this.renderStaticObjects();
		}
		this._forceRender = false;
	},

	forceRender: function () {
		this._forceRender = true;
	},

	/**
	 * Returns all coordinates of the map
	 * @return {[type]} [description]
	 */
	getAttributes: function () {

		return {
			offsetX: this.offsetX,
			offsetY: this.offsetY,
			width: this.width,
			height: this.height,
			dx: this.dx,
			dy: this.dy,
			map: this.map
		};
	},

	over: function () {
		// implemente o fim da batalha.
	},

	debugMode: function (status) {
		this._mapColorType = status;
		this._mapCartesianCoordinates = status;
	},
	
	setMapShift: function (shift) {
		if (this.dx != shift.dx || this.dy != shift.dy) {
			this.dx = shift.dx;
			this.dy = shift.dy;
			this.forceRender();
		}
	}

	/**
	 * Sets tiles that characters cannot walk.
	 * This tiles can be used to place Resources.
	 */
	// _setNonWalkableTiles: function (y, x) {
	// 	var index,
	// 		object,
	// 		nonWalkable = this.resources.resourcesType.nonWalkable,
	// 		totalResources = nonWalkable.length,
	// 		resources = this.resources.elems;

	// 	index = Math.floor(Math.random() * totalResources);

	// 	object = this.objectsPool.getEntity();

	// 	object.setImage(resources[nonWalkable[index]]);
	// 	object.setCoordinates(x, y);
	// 	object.calculate(this.dx, this.dy, this.scaledTileSize);
	// },

	// loadServerMap: function () {
	// 	var URL = "/server-side-map.json";
	// 	getJSON(URL, this._setMap.bind(this));
	// },

	// TODO: verificar novo uso para essa funcao
	/**
	 * Renders the layer where the mouse interacts. It's used either to show the mouse selection.
	 * @return void
	 */
	// renderNavLayer: function () {
	// 	var context = this.navLayer.context,
	// 		width = this.width,
	// 		height = this.height,
	// 		tileSize = this.tileSize,
	// 		tile = this._tilehovered;

	// 	if (tile.x !== null) {
	// 		context.clearRect(tile.oldX * tileSize, tile.oldY * tileSize, tileSize, tileSize);
	// 		if (this.map[tile.y][tile.x].type === 5) {
	// 			context.fillStyle = "transparent";
	// 		} else {
	// 			context.fillStyle = "rgba(0, 0, 255, 0.3)";
	// 		}
	// 		context.fillRect(tile.x * tileSize, tile.y * tileSize, tileSize, tileSize);
	// 	} else if (tile.x === null && tile.oldX !== null) {
	// 		// the last tile
	// 		context.clearRect(tile.oldX * tileSize, tile.oldY * tileSize, tileSize, tileSize);
	// 	}
	// },

	// setTileCursorHover: function (coord) {
	// 	this._tilehovered.oldX = this._tilehovered.x;
	// 	this._tilehovered.oldY = this._tilehovered.y;
	// 	this._tilehovered.x = coord.x;
	// 	this._tilehovered.y = coord.y;
	// },

	// generateRelief: function () {
	// 	var x = Math.floor(Math.random() * this.width),
	// 		y = Math.floor(Math.random() * this.height),
	// 		maxElevation = 5,
	// 		elevation;

	// 	elevation = Math.floor(Math.acos(Math.random()) * 180 / Math.PI);
	// 	elevation = Math.round(elevation * maxElevation / 90);
		
	// 	// var elevation = 4
	// 	var pos = 4;
	// 	// this.map[pos][pos].elevation = elevation;

	// 	this.temp(this.map[pos][pos]);
	// },

	// temp: function (tile) {
	// 	var x, y,
	// 		elevation,
	// 		xBegin = (tile.x - 1) < 0 ? 0 : tile.x - 1,
	// 		xEnd = (tile.x + 1) > (this.width - 1) ? this.width - 1 : tile.x + 1,
	// 		yBegin = (tile.y - 1) < 0 ? 0 : tile.y - 1,
	// 		yEnd = (tile.y + 1) > (this.height - 2) ? this.height - 1 : tile.y + 1;

	// 	if (tile.elevation === 0)
	// 		return;

	// 	for (y = yBegin; y <= yEnd; y++) {
	// 		for(x = xBegin; x <= xEnd; x++) {
	// 			if (this.map[y][x] !== tile && this.map[y][x].elevation === 0) {

	// 				elevation = Math.abs(tile.elevation - (Math.floor(Math.random() * 3)));
	// 				console.log(elevation)
	// 				this.map[y][x].elevation = elevation;

	// 				if (this.map[y][x].elevation !== 0) {
	// 					this.temp(this.map[y][x]);
	// 				}
	// 			}
	// 		}
	// 	}

	// 	// console.log("x: " + x + " xEnd: " + xEnd + " y: " + y + " yEnd: " + yEnd);

	// },

	/*
	|---------------------------------------------------------------------
	| comment
	|---------------------------------------------------------------------
	*/

	/*************************************
		Custom Events
	**************************************/
	// JSONMapLoaded: new Event('JSONMapLoaded'),




	// eventJSONMapLoaded: function (e) {
	// 	this._JSONMapLoaded = true;
	// }



});



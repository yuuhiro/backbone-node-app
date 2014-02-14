$(function() {

	Backbone.io.connect();

	var Model = Backbone.Model.extend({
		idAttribute: "_id",
		initialize: function() {
		}
	});

	var Models = Backbone.Collection.extend({
		model: Model,
		backend: 'mybackend',
		initialize: function() {
			this.bindBackend();
		}
	});

	var View = Backbone.View.extend({
		tagName: 'li',
		className: 'message_data',
		template : new EJS({url: 'javascripts/templates/message_data.ejs'}),
		events: {
			'click #delete': 'delete'
		},
		initialize: function() {
			this.$el.bind('click', _.bind(this.editMode, this));
		},
		render: function() {
			var data = this.model.toJSON();
			var date = this.convertDate(data.date);
			data.newDate = date;
			this.$el.html((this.template).render(data));
			return this;
		},
		convertDate: function(date) {
			var date = new Date(date);
			var year = date.getFullYear()
				, month = date.getMonth()
				, day = date.getDate()
				, hour = date.getHours()
				, minute = date.getMinutes();
			var newDate = {
					'year': year
				,	'month': month + 1
				, 'day': day
				, 'hour': hour
				, 'minute': minute
			}
			return newDate;
		},
		editMode: function(e) {
			var $target = $(e.target);
			if($target[0].id === 'delete'){
				return false;
			}
			var data = this.model.toJSON();
			appRouter.navigate("/edit/" + data._id, {trigger: true});
		},
		delete: function(e) {
			this.model.destroy();
			appView.render();
		}
	});

	var ViewEdit = Backbone.View.extend({
		tagName: 'div',
		className: 'edit_form',
		template : new EJS({url: 'javascripts/templates/message_edit.ejs'}),
		events: {
			"click #delete": "delete",
		  "click #editDone": "editDone",
		  'keyup #messageEdit': 'adjustHeight'
		},
		render: function() {
			var data = this.model.toJSON();
			this.$el.html((this.template).render(data));
			return this;
		},
		delete: function() {
			this.model.destroy();
			appRouter.navigate("/",{trigger: true});
		},
		editDone: function() {
			var title = $("#title").val();
			var message = $("#messageEdit").val();
			var date = new Date();
			this.model.save({title: title, message: message, date: date}, {silent: true});
			appRouter.navigate("/", {trigger: true});
			appView.render();
		},
		countHeight: function() {
			var $target = $("#messageEdit");
			$target.height($target[0].scrollHeight);
			this.scrollHeight = $target[0].scrollHeight;
		},
		adjustHeight: function() {
			var $target = $("#messageEdit");
			var currentHeight = $target[0].scrollHeight;
			//console.log(this.scrollHeight + '/' + currentHeight);
			if(this.scrollHeight < currentHeight) {
				$target.height(currentHeight);
				this.scrollHeight = $target[0].scrollHeight;
			}
		}
	});

	var ViewCreate = Backbone.View.extend({
		tagName: 'div',
		className: 'create_form',
		template : new EJS({url: 'javascripts/templates/create_page.ejs'}),
		events: {
					    "click #sendMemo": "send",
		    'click #cancel': 'cancel',
		    'keyup #message': 'adjustHeight'
		},
		render: function() {
			this.$el.html((this.template).render());
			return this;
		},
		countHeight: function() {
			var $target = $("#message");
			this.scrollHeight = $target[0].scrollHeight;
		},
		adjustHeight: function() {
			var $target = $("#message");
			var currentHeight = $target[0].scrollHeight;
			//console.log(this.scrollHeight + '/' + currentHeight);
			if(this.scrollHeight < currentHeight) {
				$target.height(currentHeight);
				this.scrollHeight = $target[0].scrollHeight;
			}
		},
		send: function() {
			var title = $("#title").val();
			if(!title){
				return false;
			}
			var message = $("#message").val();
			var date = new Date();
			this.collection.create({title: title, message: message, date: date});
			appRouter.navigate("/",{trigger: true});
		},
		cancel: function() {
			appRouter.navigate("/",{trigger: true});			
		}
	});

	var AppView = Backbone.View.extend({
		el: $('#wrap'),
		index_data : new EJS({url: 'javascripts/templates/index_data.ejs'}),
		events: {
		    'click #deleteAll': 'deleteAll',
		    "click #createMemo": "createMemo",
		},
		initialize:function () {
	    _.bindAll(this, 'render', "renderEditor");
	    //this.collection.bind("editPage", this.renderEditor);
	   	//this.collection.on("add change remove reset", this.render);
		},
		createMemo: function() {
			//this.renderCreatePage();
			appRouter.navigate("/create",{trigger: true});
		},
		render: function() {
			this.$el.html((this.index_data).render());
			this.collection.each(function(message) {
				var view = new View({ model: message });
				$("#messageList").prepend(view.render().el);
			});
		},
		renderCreatePage: function() {
			var viewCreate = new ViewCreate({collection: this.collection});
			this.$el.html(viewCreate.render().el);
			viewCreate.countHeight();
		},
		renderEditor: function(id) {
			var message = this.collection.get(id);
			var view = new ViewEdit({ model: message });
			$('#wrap').empty().html(view.render().el);
			view.countHeight();
		},
		deleteAll: function() {
			if(window.confirm('すべて削除されます')){
				var cloneModels = _.clone(this.collection.models);
				_.each(cloneModels, function(model) {
					model.destroy();
				});
			}else{
				return false;
			}
			this.render();
		}
	});

	var AppRouter = Backbone.Router.extend({
		routes: {
			"": "index",
			"create": "create",
			"edit/:id": "edit"
		},
		index: function() {
			console.log("index");
			models.fetch({
				success: function() {
					appView.render();
				},
				silent: true
			});
			//appView.render();
		},
		create: function() {
			console.log("create");
			appView.renderCreatePage();
		},
		edit: function(id) {
			console.log("edit");
			models.fetch({
				success: function() {
					appView.renderEditor(id);
				},
				silent: true
			});
		}
	});

	var models = new Models();
	var appView = new AppView({collection: models});
	var appRouter = new AppRouter();
	Backbone.history.start();

});

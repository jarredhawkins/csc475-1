$.widget("custom.visualization", {
    options: {
        drum_data: {},
        widget_height: 100,
        song_length: 18,
        song_path : "",
        zoom_rate: 0.5,
        wave_color: "LightGrey",
        drum_props: {
            "Snare drum": {
                color: "green",
                radius: 10,
                height: 30
            },
            "Bass drum": {
                color: "blue",
                radius: 10,
                height: 50
            },
            "Hi-hat closed": {
                color: "pink",
                radius: 10,
                height: 70
            },
            "Hi-hat open": {
                color: "orange",
                radius: 10,
                height: 90
            }
        }
    },

    _create: function() {
        this.width = this.options.song_length * this.options.zoom_rate * 1000;
        this.svgContainer = d3.select('#visualization')
            .append('svg')
            .attr('class', 'visualization')
            .attr('width', this.width)
            .attr('height', this.options.widget_height)
            .on("dblclick", $.proxy(this._add_new_circle, this));

        d3.select("#visualization").append("svg")
            .attr("class", "fixed")
            .attr("width", 3)            
            .append("line")
            .attr("y1", this.options.widget_height)
            .attr("y2", 0)
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("stroke-width", 3)
            .attr("stroke", "black");

        this.scale = d3.scaleLinear()
            .domain([0, this.options.song_length])
            .range([0, this.width]);

        this.menu = this._get_context_menu();
        
        this.drum_circles = this._get_circle_data(this.options.drum_data);
        this.circles = this.svgContainer.append("g").selectAll("circle")
            .data(this.drum_circles)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return d.x;})
            .attr("cy", function (d) { return d.y;})
            .attr("r", function (d) { return d.radius;})
            .attr("class", function (d) {return d.c;})
            .style("fill", function (d) {return d.color;})
            .on('contextmenu', d3.contextMenu(this.menu))
            .call(d3.drag()
                .on("start", this._dragstarted)
                .on("drag", this._dragged)
                .on("end", this._dragended));
        
        var xAxis = d3.axisBottom(this.scale)
            .ticks(this.options.song_length * this.options.zoom_rate * 100)
            .tickSize(10)
            .tickFormat(function(d) {
                var milli = (d * 1000 % 1000).toFixed(0);
                var seconds = d.toFixed(0);
                if (milli == 0) {
                    return seconds + "s";
                } else if (milli % 100 == 0) {
                    return milli;
                } else {
                    "";
                }
            });

        this.axis = this.svgContainer.append("g").call(xAxis);
        d3.selectAll(".tick line")
            .attr("y2", function(d) {
                var milli = (d * 1000 % 1000).toFixed(0);
                if (milli == 0) {
                    return 12;
                } else if (milli % 100 == 0) {
                    return 10;
                } else if  (milli % 10 == 0) {
                    return 5;
                } else {
                    return 2;
                }
            });
        
        var labels = d3.select("#labels").append('svg')
                    .attr('class', 'lables')
                    .attr('width', 150)
                    .attr('height', 100);
        
                var label_data = this._get_label_data();
                labels.append("g").selectAll("circle")
                    .data(label_data)
                    .enter()
                    .append("circle")
                    .attr("cx", function (d) { return d.x;})
                    .attr("cy", function (d) { return d.y;})
                    .attr("r", function (d) { return d.radius;})
                    .style("fill", function (d) {return d.color;});
        
                labels.selectAll("text")
                    .data(label_data)
                    .enter()
                    .append("text")
                    .attr("x", function(d) { return d.x + 50; })
                    .attr("y", function(d) { return d.y; })
                    .text( function (d) { return d.text; })
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "12px")
                    .attr("fill", "black");

        $("#visualization").width(this.width);
        var wavesurfer = WaveSurfer.create({
            container: '#visualization',
            waveColor: this.options.wave_color,
            interact: false
        });
        wavesurfer.load(this.options.song_path);
    },

    _get_label_data: function() {
        var label_data = [];
        var self = this;
        Object.keys(this.options.drum_props).forEach(function(drum_type) {
            var prop = self.options.drum_props[drum_type];
            label_data.push({
                text: drum_type,
                x: 10,
                y: prop.height,
                color: prop.color,
                radius: prop.radius
            })
        });
        return label_data;
    },
    
    _add_new_circle: function () {
        var mouse_xy = d3.mouse(this.svgContainer.node());
        var mouse_x = mouse_xy[0];
        var mouse_y = mouse_xy[1];
        
        // Get colour and class of click
        var closest_class_distance = Infinity;
        var new_class = "";
        var new_color = "";
        var new_radius = 0;
        var new_height = 0;
        for (var prop in this.options.drum_props) {
            var class_distance = Math.abs(this.options.drum_props[prop].height - mouse_y)

            if (class_distance < closest_class_distance) {
                new_class = prop;
                new_height = this.options.drum_props[prop].height;                
                new_color = this.options.drum_props[prop].color;
                new_radius = this.options.drum_props[prop].radius;

                closest_class_distance = class_distance;
            }
        };

        var d = [{
            x: mouse_x,
            y: new_height,
            radius: new_radius,
            c: new_class,
            color: new_color
        }];        

        this.svgContainer.select("g")
            .append("circle")
            .data(d)
            .attr("cx", function (d) { return d.x;})
            .attr("cy", function (d) { return d.y;})
            .attr("r", function (d) { return d.radius;})
            .attr("class", function (d) {return d.c;})
            .style("fill", function (d) {return d.color;})
            .on('contextmenu', d3.contextMenu(this.menu))
            .call(d3.drag()
                .on("start", this._dragstarted)
                .on("drag", this._dragged)
                .on("end", this._dragended));
        this.circles = this.svgContainer.selectAll("circle");
    },

    _get_circle_data: function(drum_events) {
        var jsonCircles = [];
        Object.keys(drum_events).forEach(function(drum_type) {
            drum_events[drum_type].forEach(function(time) {
                var radius = this.options.drum_props[drum_type].radius;
                var color = this.options.drum_props[drum_type].color;
                var height = this.options.drum_props[drum_type].height;
                jsonCircles.push({
                    "x": this.scale(time),
                    "y": height,
                    "radius": radius,
                    "color": color,
                    "c": drum_type
                });
            }, this);
        }, this);
        return jsonCircles;
    },

    seek: function(seconds) {
        $(".visualization").css("left", -this.scale(seconds) + 50); // 50 margin
        $("wave").css("left", -this.scale(seconds));
    },

    stop: function() {
        this.seek(0);
    },

    get_all_drum_times: function() {
        var output = {}
        var drum_props = this.options.drum_props;
        var song_length = this.options.song_length;
        var zoom_rate = this.options.zoom_rate;
        var width = song_length * zoom_rate * 1000;
        var x_to_t = d3.scaleLinear()
            .domain([0, width])
            .range([0, song_length]);

        // Init empty subobject for each class in properties
        Object.keys(this.options.drum_props).forEach(function(key) {
            output[key] = []
        });

        // Add every circles data to output
        d3.selectAll("circle")._groups[0].forEach(function(circle) {
            var x_val = circle.cx.baseVal.value;
            var x_time = x_to_t(x_val);
            output[circle.className.baseVal].push(x_time);
        });
        return output
    },

    _get_context_menu: function() {
        var self = this;
        var menu = [];
        menu[0] =
        {
            title: 'Delete',
            action: function (elm, d, i) {
                var remove = d;
                d3.selectAll("circle").filter(function (d) {
                    return d == remove;
                }).remove();
            }
        };
        for (let m = 0; m < Object.keys(this.options.drum_props).length; m++) {
            menu[m + 1] =
            {
                title: function (d) {
                    return Object.keys(self.options.drum_props)[m];
                },
                action: function (elm, d, i) {
                    var remove = d;
                    var type = Object.keys(self.options.drum_props)[m];
                    var color = self.options.drum_props[type].color;
                    var radius = self.options.drum_props[type].radius;
                    var height = self.options.drum_props[type].height;

                    self.circles.filter(function (d) {
                        return d == remove;
                    }).attr('class', type)
                        .attr('r', radius)
                        .attr('cy', height)
                        .style('fill', color)
                        .enter();
                }
            };
        }
        return menu;
    },
        
    _dragstarted: function (d) {
        d3.select(this).raise().classed("active", true);
    },
    
    _dragged: function (d) {
        d3.select(this).attr("cx", d.x = d3.event.x);
    },
    
    _dragended: function (d) {
        d3.select(this).classed("active", false);
    },
});


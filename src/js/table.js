// row/column manipulation functions.
// We decided to roll our own as existing
// libs with React.JS were missing critical
// features.

var showJSON = function(data, _type, _id){
        React.render(<Modal show={data} _type={_type} _id={_id}/>, document.getElementById('modal'));
};

var Column = React.createClass({
    render: function(){
        return <th id={this.props._item}>{this.props._item}</th>;
    }
});


// **Cell** defines the properties of each cell in the
// data table.
var Cell = React.createClass({
    render: function(){
        // exposing visibility property allows us to show / hide
        // individual cells
        var vb = this.props.visibility;
            style = {display:vb};
            data = this.props.item;
            // The id of the html element is generated
            // in keys.js.
            _id = this.props._id;
            _type = this.props._type;
            to_display = data;

        // cell-data of format ``string`` and ``number`` is rendered inline.
        // If a field is a JSON object instead, it's displayed as a modal pop-up.
        if(typeof data !== 'string'){
            if(typeof data !== 'number'){
                to_display = <a href="#"
                                onClick={showJSON.bind(null, data, _type, _id)}>
                                <i className="fa fa-external-link" />
                            </a>;
            }
        }
        return <td
                id={this.props.unique}
                key={this.props.unique}
                style={style}>
                    {to_display}
                </td>;
    }
});

// This is just to give  unique id to the rows so that we can add
// CSS transitions upon updates/deletes
var Row = React.createClass({
    render: function(){
        return <tr id={this.props._id}>{this.props.row}</tr>;
    }
});

// This is another wrapper around the data table to implement
// pagination, throbbers, styling etc.
var Table = React.createClass({
    componentDidMount: function() {
        console.log("mounted");
        var elem = document.getElementById('table-container');
        // WE are listning for scroll even so we get notified
        // when the scroll hits the bottom. For pagination.
        elem.addEventListener('scroll', this.props.scrollFunction);
    },
    render: function() {
        if(this.props.renderRows.length <= 1){
            return(
                    <div id='table-container' className="waiting">
                        <i className="fa fa-spinner fa-pulse fa-5x centered"></i>
                    </div>
                )
        }
        return (
            <div id='table-container' className="table-container">
                <table id="data-table"
                className="table table-striped table-bordered">
                    <thead id='columns'>
                        <tr>
                            {this.props.renderColumns}
                        </tr>
                    </thead>
                    <tbody className='exp-scrollable'>
                            {this.props.renderRows}
                    </tbody>
                </table>
            </div>
        );
    }
})

// This has the main properties that define the main data table
// i.e. the right side.
var DataTable = React.createClass({
    render: function () {
        var data = this.props._data;
            fixed = ['json', '_id', '_type'];
            columns = ['json', '_type', '_id'];
        for(var each in data){
            for(column in data[each]){
                if(fixed.indexOf(column) <= -1){
                    if(columns.indexOf(column) <= -1){
                        columns.push(column);
                    }
                }
            }
        }
        var rows = [];
        for(var row in data){
            var newRow = {};
            newRow['json'] = data[row]['json'];
            newRow['_type'] = data[row]['_type'];
            newRow['_id'] = data[row]['_id'];
            for(var each in columns){
                // We check if every column of the new document
                // is present already, if not we appen to the
                // right.
                if(fixed.indexOf(columns[each]) <= -1){
                    if(data[row][columns[each]]){
                        var cell = data[row][columns[each]];
                        newRow[columns[each]] = cell;
                    }
                    else{
                        // Just to make sure it doesn't display
                        // a null.
                        newRow[columns[each]] = '';
                    }
                }
            }
            renderRow = [];
            for(var each in newRow){
                var _key = keyGen(data[row], each);
                    elem = document.getElementById(each);
                    visibility = '';

                // We see if the column is already closed of open
                // using the html key attribute and render their
                // visibility correspondingly.
                if(elem){
                    visibility = elem.style.display;
                }
                renderRow.push(<Cell
                                item={newRow[each]}
                                unique={_key}
                                key={_key}
                                _id={newRow['_id']}
                                _type={newRow['_type']}
                                visibility={visibility} />);
            }
            rows.push({'_key': String(data[row]['_id'])+String(data[row]['_type']), 'row':renderRow});
        }
        var renderColumns = columns.map(function(item){
            return <Column _item={item} key={item} />;
        });
        var renderRows = rows.map(function(item)
        {
            var _key = item['_key'];
            var row = item['row'];
            return <Row key={_key} _id={_key} row={row} />;
        });
        return (
            <div className="dejavu-table">
            <Dropdown cols={columns} />
            <Table
             renderColumns={renderColumns}
             renderRows={renderRows}
             scrollFunction={this.props.scrollFunction}
             selectedTypes={this.props.selectedTypes}/>
            </div>
        );
    }
});

// Each row in the types table on the left side.
var TypeRow = React.createClass({
    getInitialState: function(){
        // we store the state(checked/unchecked) for every type
        // so that when we reload, the state restores.
        var value = window.localStorage.getItem(this.props.type);
            checked = false;
        if(value == "true"){
            checked = true;
            this.props.watchTypeHandler(this.props.type);
        }
        return {isChecked: checked};
    },
    unwatch: function() {
        var checked = false;
        if(this.state.isChecked){
            this.props.unwatchTypeHandler(this.props.type);
        }
        else{
            checked = true;
            this.props.watchTypeHandler(this.props.type);
        }
        // every time its checked we update the local storage.
        window.localStorage.setItem(this.props.type, checked);
        this.setState({isChecked: checked});
    },
    render: function() {
        return(
                <li>
                    <input
                     id={this.props.type}
                     type="checkbox"
                     key={this.props.type}
                     defaultChecked={this.state.isChecked}
                     onChange={this.unwatch}
                     readOnly={false}/>
                    <label htmlFor={this.props.type}>{this.props.type}</label>
                </li>
        );
    }
});

// This is for the table holding the types on the
// left tab.
var TypeTable = React.createClass({
    render: function()  {
        var types = this.props.Types;
            rowObj = [];
            appname = APPNAME;

        for(var type in types){
            rowObj.push(<TypeRow
                         key={type}
                         type={types[type]}
                         unwatchTypeHandler={this.props.unwatchTypeHandler}
                         watchTypeHandler={this.props.watchTypeHandler} />);
        }
        if(types.length <= 0){
            return (
            <div className='left-tab'>
            <div className="app-desc"><span className="app-name">{appname}</span></div>
            <div className="waiting"><i className="fa fa-spinner fa-pulse fa-3x centered" /></div>
            </div>
            );   
        }
        return (
            <div className='left-tab'>
            <div className="app-desc"><span className="app-name">{appname}</span></div>
            <ul className='fa-ul types-list'>
                {rowObj}
            </ul>
            </div>
        );
    }
});

import React from "react";
import "./application.scss";
import {Layout, Flex} from "react-layout-pane";
import StatusBar from "./status-bar/StatusBar";
import electron from "electron";
const ipc = electron.ipcRenderer;



class Application extends React.Component {

    constructor(props) {
        super(props);
        
        ipc.on('device-activated', (event, {device, devices}) => {
            console.log(`* Device '${device}' activated, devices: '${devices}'`);

            devices.map((device, index) => {
                console.log(`* Device #${index + 1}: ${device}`);
            });

            this.setState({
                device: device,
                devices: devices
            });
        });
        ipc.on('device-deactivated', (event, {device, devices}) => {
            console.log(`* Device '${device.name}' deactivated, devices: '${devices}'`);
            
            this.setState({
                device: null,
                devices: devices
            });
        });
        ipc.on('card-inserted', (event, {atr, device}) => {
            console.log(`* Card '${atr}' inserted into '${device}'`);

            this.setState({
                card: atr
            });
        });
        ipc.on('card-removed', (event, {name}) => {
            console.log(`* Card removed from '${name}' `);

            this.setState({
                card: null,
                current: null,
                applications: []
            });
        });
        ipc.on('command-issued', (event, {atr, command}) => {
            console.log(`* Command '${command}' issued to '${atr}' `);
        });
        ipc.on('response-received', (event, {atr, command, response, ok, meaning}) => {
            console.log(`* Response '${response}' received from '${atr}' in response to '${command}'`);

            let log = this.state.log;
            log.push({
                command: command,
                response: response,
                ok: ok,
                meaning: meaning
            });

            let current = this.state.current;
            console.log(`\tCurrent application ${current}`);

            this.setState({
                log: log
            });
        });
        ipc.on('emv-application-found', (event, {applicationTemplateTlv}) => {
            console.log(`* EMV Application found '${applicationTemplateTlv}'`);
            let newApplications = [...this.state.applications, applicationTemplateTlv];
            this.setState({
                applications: newApplications
            });
            console.log(`Applciations ${newApplications}`);
        });

        ipc.on('application-selected', (event, {application}) => {
            console.log(`* Application Selected ${application}`);
            this.setState({
                current: application
            });
        });


        ipc.on('error', (event, message) => {
            console.log(event, message);
        });

        this.state = {
            device: null,
            devices: [],
            card: null,
            log: [],
            current: null,
            applications: []
        };
    }


    clearLog() {
        this.setState({
           log: []
        });
    }

    clearRepl() {
        this.setState({
            repl: ''
        });
    }

    replKeyUp(e) {
        if (e.keyCode === 13 && this.state.repl.length > 0) {
            ipc.send('repl', this.state.repl);
        }
    }

    replChange(e) {
        var value = e.target.value;
        this.setState({
           repl: value
        });
    }

    interrogate() {
        ipc.send('interrogate', {});
    }

    replRun() {
        ipc.send('repl', this.state.repl);
    }

    onSelectDevice(device) {
        console.log(`onSelectDevice ${device}`);
        this.setState({
            device: device
        });
    }

    render() {
        //console.log(`Application.state: ${JSON.stringify(this.state)}`);
        return (
            <Layout type="column">
                <Flex className="application">
                    {this.props.children &&
                    React.cloneElement(this.props.children, {
                        log: this.state.log,
                        interrogate: () => {this.interrogate()},
                        clearLog: () => {this.clearLog()},
                        repl: this.state.repl,
                        clearRepl: () => {this.clearRepl()},
                        replChange: (e) => {this.replChange(e)},
                        replKeyUp: (e) => {this.replKeyUp(e)},
                        replRun: () => this.replRun(),
                        current: this.state.current,
                        applications: this.state.applications
                    })
                    }
                </Flex>
                <StatusBar device={this.state.device} devices={this.state.devices} onSelectDevice={this.onSelectDevice} card={this.state.card} />
            </Layout>
        );
    }
}

export default Application;

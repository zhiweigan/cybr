/*
  ==============================================================================

    FluidIpcServer.h
    Created: 31 Mar 2020 6:42:03pm
    Author:  charles

  ==============================================================================
*/

#pragma once

#include "../JuceLibraryCode/JuceHeader.h"
#include "temp_OSCInputStream.h"
#include "FluidOscServer.h"

//==============================================================================
class FluidIpc : public InterprocessConnection{
public:
    void connectionMade() override;
    void connectionLost() override;
    void messageReceived(const MemoryBlock& message) override;
    
    void setFluidServer(FluidOscServer& server);
private:
    FluidOscServer* fluidOscServer = nullptr;
};

//==============================================================================
class FluidIpcServer : public InterprocessConnectionServer{
public:
    FluidIpcServer(FluidOscServer& server);
    InterprocessConnection* createConnectionObject() override;
    
private:
    int ipc_num = 0;
    std::map<int, FluidIpc> ipcMap;
    FluidOscServer* fluidOscServer = nullptr;
};

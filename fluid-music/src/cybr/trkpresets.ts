/**
 * This is a .trkpreset in string format that contains a rack with a single
 * continuous macro parameter named 'width. The width behaves as follows:
 * - width = 0.0 // inverted left / right
 * - width = 0.5 // mono
 * - width = 1.0 // standard stereo
 */
export const stereoWidthRack = 
`<?xml version="1.0" encoding="UTF-8"?>

<PRESET name="stereo-width" tags="Rack" path="/Users/charles/Library/Application Support/Tracktion/Waveform/Presets"
        filename="stereo-width.trkpreset">
  <RACK id="1004" name="Stereo Width">
    <MACROPARAMETERS id="1004">
      <MACROPARAMETER id="1006" name="width" value="1.0"/>
      <MODIFIERASSIGNMENTS/>
    </MACROPARAMETERS>
    <WINDOWSTATE windowPos="528 478 847 658" active="1" windowLocked="1"/>
    <OUTPUT name="midi output"/>
    <OUTPUT name="output 1 (left)"/>
    <OUTPUT name="output 2 (right)"/>
    <INPUT name="midi input"/>
    <INPUT name="input 1 (left)"/>
    <INPUT name="input 2 (right)"/>
    <MODIFIERS/>
    <FACEPLATE width="8.0" height="4.0" autoSize="1" stretch="1">
      <RESOURCES/>
    </FACEPLATE>
    <PLUGININSTANCE x="0.5377777777777778" y="0.4092140921409214">
      <PLUGIN id="1008" type="volume" windowLocked="1" enabled="1" pan="-1.0"
              base64:parameters="8.vEla......." windowX="607" windowY="205"
              volume="0.5488116145133972">
        <MACROPARAMETERS id="1010"/>
        <MODIFIERASSIGNMENTS>
          <MACRO source="1006" paramID="pan" value="-1.0" offset="0.5"/>
        </MODIFIERASSIGNMENTS>
        <FACEPLATE width="8.0" height="4.0" autoSize="1" assignEnabled="0">
          <RESOURCES/>
          <BACKGROUND imageAlpha="1.0"/>
        </FACEPLATE>
      </PLUGIN>
    </PLUGININSTANCE>
    <CONNECTION src="0" dst="1008" srcPin="1" dstPin="1"/>
    <CONNECTION src="1008" dst="0" srcPin="1" dstPin="1"/>
    <CONNECTION src="1008" dst="0" srcPin="2" dstPin="2"/>
    <CONNECTION src="0" dst="1008" srcPin="0" dstPin="0"/>
    <CONNECTION src="1008" dst="0" srcPin="0" dstPin="0"/>
    <PLUGININSTANCE x="0.5533333333333333" y="0.8157181571815718">
      <PLUGIN id="1011" type="volume" windowLocked="1" enabled="1" pan="1.0"
              base64:parameters="8.vEla......." windowX="607" windowY="205"
              volume="0.5488116145133972">
        <MACROPARAMETERS id="1013"/>
        <MODIFIERASSIGNMENTS>
          <MACRO source="1006" paramID="pan" value="1.0" offset="-0.5"/>
        </MODIFIERASSIGNMENTS>
        <FACEPLATE width="8.0" height="4.0" autoSize="1">
          <RESOURCES/>
        </FACEPLATE>
      </PLUGIN>
    </PLUGININSTANCE>
    <CONNECTION src="1011" dst="0" srcPin="1" dstPin="1"/>
    <CONNECTION src="1011" dst="0" srcPin="2" dstPin="2"/>
    <CONNECTION src="0" dst="1008" srcPin="1" dstPin="2"/>
    <CONNECTION src="0" dst="1011" srcPin="2" dstPin="2"/>
    <CONNECTION src="0" dst="1011" srcPin="2" dstPin="1"/>
  </RACK>
</PRESET>
`;

export const cybrPanRack = 
`<?xml version="1.0" encoding="UTF-8"?>

<PRESET name="CybrPan" tags="Rack" description="Used by the Fluid Engine for width and volume automation"
        path="/Users/charles/Library/Application Support/Tracktion/Waveform/Presets"
        filename="CybrPan.trkpreset">
  <RACK id="1131" name="CybrPan">
    <MACROPARAMETERS id="1004">
      <MACROPARAMETER id="1006" name="width" value="0.0"/>
      <MODIFIERASSIGNMENTS/>
      <MACROPARAMETER id="1008" name="volume-automation" value="0.5"/>
    </MACROPARAMETERS>
    <WINDOWSTATE windowPos="725 117 847 658" active="1" windowLocked="1"/>
    <OUTPUT name="midi output"/>
    <OUTPUT name="output 1 (left)"/>
    <OUTPUT name="output 2 (right)"/>
    <INPUT name="midi input"/>
    <INPUT name="input 1 (left)"/>
    <INPUT name="input 2 (right)"/>
    <MODIFIERS/>
    <FACEPLATE width="8.0" height="4.0" autoSize="1" stretch="1">
      <RESOURCES/>
    </FACEPLATE>
    <PLUGININSTANCE x="0.2622222222222222" y="0.4986449864498645">
      <PLUGIN id="1010" type="volume" windowLocked="1" enabled="1" pan="0.0"
              windowX="607" windowY="205" volume="0.5488116145133972" base64:parameters="8.vEla.....9K">
        <MACROPARAMETERS id="1011"/>
        <MODIFIERASSIGNMENTS>
          <MACRO source="1006" paramID="pan" value="-1.0" offset="0.5"/>
        </MODIFIERASSIGNMENTS>
        <FACEPLATE width="8.0" height="4.0" autoSize="1" assignEnabled="0">
          <RESOURCES/>
          <BACKGROUND imageAlpha="1.0"/>
        </FACEPLATE>
      </PLUGIN>
    </PLUGININSTANCE>
    <CONNECTION src="0" dst="1010" srcPin="1" dstPin="1"/>
    <PLUGININSTANCE x="0.2622222222222222" y="0.7859078590785907">
      <PLUGIN id="1013" type="volume" windowLocked="1" enabled="1" pan="0.0"
              windowX="607" windowY="205" volume="0.5488116145133972" base64:parameters="8.vEla.....9C">
        <MACROPARAMETERS id="1015"/>
        <MODIFIERASSIGNMENTS>
          <MACRO source="1006" paramID="pan" value="1.0" offset="-0.5"/>
        </MODIFIERASSIGNMENTS>
        <FACEPLATE width="8.0" height="4.0" autoSize="1">
          <RESOURCES/>
        </FACEPLATE>
      </PLUGIN>
    </PLUGININSTANCE>
    <CONNECTION src="0" dst="1010" srcPin="1" dstPin="2"/>
    <CONNECTION src="0" dst="1013" srcPin="2" dstPin="2"/>
    <CONNECTION src="0" dst="1013" srcPin="2" dstPin="1"/>
    <PLUGININSTANCE x="0.8022222222222222" y="0.6395663956639567">
      <PLUGIN id="1016" type="volume" windowLocked="1" enabled="1" volume="0.740818202495575"
              windowX="462" windowY="310">
        <MACROPARAMETERS id="1019"/>
        <MODIFIERASSIGNMENTS>
          <MACRO source="1008" paramID="volume" value="1.0" offset="-0.5"/>
        </MODIFIERASSIGNMENTS>
        <FACEPLATE width="8.0" height="4.0" autoSize="1">
          <RESOURCES/>
        </FACEPLATE>
      </PLUGIN>
    </PLUGININSTANCE>
    <CONNECTION src="1010" dst="1016" srcPin="1" dstPin="1"/>
    <CONNECTION src="1013" dst="1016" srcPin="1" dstPin="1"/>
    <CONNECTION src="1010" dst="1016" srcPin="2" dstPin="2"/>
    <CONNECTION src="1013" dst="1016" srcPin="2" dstPin="2"/>
    <CONNECTION src="1016" dst="0" srcPin="1" dstPin="1"/>
    <CONNECTION src="1016" dst="0" srcPin="2" dstPin="2"/>
    <CONNECTION src="0" dst="1016" srcPin="0" dstPin="0"/>
    <CONNECTION src="1016" dst="0" srcPin="0" dstPin="0"/>
  </RACK>
</PRESET>
`;

// Data for pump type descriptions
const pumpTypeDescriptions = {
    'A': 'Slurry Pump, end suction',
    'B': 'Solid-handling, end suction',
    'C': 'Submersible Sewage',
    'F': 'ASME B73, API End Section-small',
    'G': 'End Section Large',
    'J': 'Double Section',
    'V': 'Vertical Turbine, Mixed flow and propeller, single and multistage diffuser type'
};

// Pump efficiency calculation functions
function calculatePumpFlowM3S(selectedUnit, pumpFlowValue) {
    let f4_pump_flow_m3s = 0.0;
    
    if (selectedUnit == 1) {
        f4_pump_flow_m3s = pumpFlowValue;
    } else if (selectedUnit == 2) {
        f4_pump_flow_m3s = pumpFlowValue / 60000;
    } else if (selectedUnit == 3) {
        f4_pump_flow_m3s = pumpFlowValue / 1000;
    } else if (selectedUnit == 4) {
        f4_pump_flow_m3s = pumpFlowValue * 0.00006309;
    } else {
        throw new Error('Invalid Unit for Flow (C5)');
    }
    
    return f4_pump_flow_m3s;
}

function calculateEfficiencyOptimum(pumpType, f4_pump_flow_m3s) {
    const ln_f4 = Math.log(f4_pump_flow_m3s); // Natural logarithm
    let f9_efficiency_optimum = 0.0;
    
    if (pumpType === "A") {
        f9_efficiency_optimum = 85.134 + 3.85 * ln_f4 - 1.152 * Math.pow(ln_f4, 2);
    } else if (pumpType === "B" || pumpType === "C") {
        f9_efficiency_optimum = 87.6345 + 2.0326 * ln_f4 - 1.4278 * Math.pow(ln_f4, 2);
    } else if (pumpType === "F") {
        f9_efficiency_optimum = 85.778 - 2.219 * ln_f4 - 1.481 * Math.pow(ln_f4, 2);
    } else if (pumpType === "G") {
        f9_efficiency_optimum = 88.365 + 1.701 * ln_f4 - 0.367 * Math.pow(ln_f4, 2);
    } else if (pumpType === "J") {
        f9_efficiency_optimum = 90.466 + 1.074 * ln_f4 - 0.446 * Math.pow(ln_f4, 2);
    } else if (pumpType === "V") {
        f9_efficiency_optimum = 89.575 + 1.102 * ln_f4 - 0.539 * Math.pow(ln_f4, 2);
    } else {
        throw new Error('Invalid Pump Type (F6)');
    }
    
    return f9_efficiency_optimum;
}

function calculateEfficiencyCorrection(pumpType, specificSpeed) {
    let f10_efficiency_correction = 0.0;
    
    if (pumpType === "V") {
        if (specificSpeed <= 100) {
            f10_efficiency_correction = (0.00000001875 * Math.pow(specificSpeed, 4) -
                                       0.00001219 * Math.pow(specificSpeed, 3) +
                                       0.002517 * Math.pow(specificSpeed, 2) -
                                       0.2123 * specificSpeed + 6.4316);
        } else { // specificSpeed > 100
            f10_efficiency_correction = (0.0000000006184 * Math.pow(specificSpeed, 4) -
                                       0.0000007899 * Math.pow(specificSpeed, 3) +
                                       0.0003441 * Math.pow(specificSpeed, 2) -
                                       0.0471 * specificSpeed + 2.0453);
        }
    } else { // pumpType is not "V"
        if (specificSpeed < 30) {
            f10_efficiency_correction = (-0.0002692 * Math.pow(specificSpeed, 3) +
                                       0.02558 * Math.pow(specificSpeed, 2) -
                                       0.9566 * specificSpeed + 13.717);
        } else if (specificSpeed <= 90) {
            f10_efficiency_correction = (-0.00002077 * Math.pow(specificSpeed, 3) +
                                       0.004611 * Math.pow(specificSpeed, 2) -
                                       0.3076 * specificSpeed + 6.452);
        } else { // specificSpeed > 90
            f10_efficiency_correction = (0.0000471 * Math.pow(specificSpeed, 2) +
                                       0.01879 * specificSpeed - 0.9191);
        }
    }
    
    return f10_efficiency_correction;
}

function calculateEfficiencyDeviation(f4_pump_flow_m3s) {
    let f11_efficiency_deviation = 0.0;
    
    if (f4_pump_flow_m3s <= 0.05) {
        f11_efficiency_deviation = (19907642.3 * Math.pow(f4_pump_flow_m3s, 4) -
                                  2287352.57 * Math.pow(f4_pump_flow_m3s, 3) +
                                  90466.93 * Math.pow(f4_pump_flow_m3s, 2) -
                                  1521.98 * f4_pump_flow_m3s + 16.6181);
    } else if (f4_pump_flow_m3s <= 0.9) {
        f11_efficiency_deviation = (56.5767 * Math.pow(f4_pump_flow_m3s, 4) -
                                  120.2869 * Math.pow(f4_pump_flow_m3s, 3) +
                                  89.0594 * Math.pow(f4_pump_flow_m3s, 2) -
                                  28.54 * f4_pump_flow_m3s + 6.008);
    } else if (f4_pump_flow_m3s <= 10) {
        f11_efficiency_deviation = (0.0003773 * Math.pow(f4_pump_flow_m3s, 4) -
                                  0.0105409 * Math.pow(f4_pump_flow_m3s, 3) +
                                  0.111228 * Math.pow(f4_pump_flow_m3s, 2) -
                                  0.55649 * f4_pump_flow_m3s + 2.2392);
    } else {
        f11_efficiency_deviation = 1.03;
    }
    
    return f11_efficiency_deviation;
}

function performCalculations(data) {
    try {
        const { C5: selectedUnit, C6: pumpFlowValue, F5: specificSpeed, F6: pumpType } = data;
        
        // Calculate F4: PUMP FLOW IN M3/S
        const f4_pump_flow_m3s = calculatePumpFlowM3S(selectedUnit, pumpFlowValue);
        
        // Ensure F4 is positive for LN calculations
        if (f4_pump_flow_m3s <= 0) {
            throw new Error('Pump Flow must be greater than zero for calculations.');
        }
        
        // Calculate F9: Efficiency at Optimum
        const f9_efficiency_optimum = calculateEfficiencyOptimum(pumpType, f4_pump_flow_m3s);
        
        // Calculate F10: Efficiency Correction
        const f10_efficiency_correction = calculateEfficiencyCorrection(pumpType, specificSpeed);
        
        // Calculate F11: Efficiency Deviation
        const f11_efficiency_deviation = calculateEfficiencyDeviation(f4_pump_flow_m3s);
        
        // Calculate F12: Actual Efficiency
        const raw_actual_efficiency = f9_efficiency_optimum - f10_efficiency_correction;
        const f12_actual_efficiency_text = `${raw_actual_efficiency.toFixed(2)} ± ${f11_efficiency_deviation.toFixed(2)} %`;
        
        return {
            efficiencyOptimum: f9_efficiency_optimum,
            efficiencyCorrection: f10_efficiency_correction,
            efficiencyDeviation: f11_efficiency_deviation,
            actualEfficiency: f12_actual_efficiency_text
        };
        
    } catch (error) {
        throw new Error(error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const pumpTypeSelect = document.getElementById('pumpType');
    const pumpTypeDescriptionElem = document.getElementById('pumpTypeDescription');
    const calculateBtn = document.getElementById('calculateBtn');

    // Function to update pump type description
    function updatePumpTypeDescription() {
        const selectedType = pumpTypeSelect.value;
        pumpTypeDescriptionElem.textContent = pumpTypeDescriptions[selectedType] || 'Select a pump type to see description.';
    }

    // Event listener for pump type selection change
    pumpTypeSelect.addEventListener('change', updatePumpTypeDescription);

    // Initial description display
    updatePumpTypeDescription();

    // Event listener for the calculate button
    calculateBtn.addEventListener('click', () => {
        const pumpFlowValue = parseFloat(document.getElementById('pumpFlowValue').value);
        const selectedFlowUnit = document.querySelector('input[name="flowUnit"]:checked').value;
        const specificSpeed = parseFloat(document.getElementById('specificSpeed').value);
        const pumpType = document.getElementById('pumpType').value;

        // Basic validation
        if (isNaN(pumpFlowValue) || isNaN(specificSpeed) || !pumpType) {
            alert('Please enter valid numbers for Pump Flow and Specific Speed, and select a Pump Type.');
            return;
        }

        // Prepare data for calculation
        const data = {
            C5: parseInt(selectedFlowUnit),
            C6: pumpFlowValue,
            F5: specificSpeed,
            F6: pumpType
        };

        try {
            // Perform calculations locally
            const result = performCalculations(data);

            // Update the display with the calculated results
            document.getElementById('efficiencyOptimum').textContent = result.efficiencyOptimum.toFixed(2);
            document.getElementById('efficiencyCorrection').textContent = result.efficiencyCorrection.toFixed(2);
            document.getElementById('efficiencyDeviation').textContent = result.efficiencyDeviation.toFixed(2);
            document.getElementById('actualEfficiency').innerHTML = result.actualEfficiency; // Use innerHTML for ± symbol and %
            
        } catch (error) {
            console.error('Error calculating efficiencies:', error);
            alert('An error occurred during calculation. Please check your inputs. Error: ' + error.message);
            // Clear results on error
            document.getElementById('efficiencyOptimum').textContent = '--';
            document.getElementById('efficiencyCorrection').textContent = '--';
            document.getElementById('efficiencyDeviation').textContent = '--';
            document.getElementById('actualEfficiency').textContent = '--';
        }
    });
});
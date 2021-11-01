// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "base64-sol/base64.sol";

/// @title NFTSVG
/// @notice Provides a function for generating an SVG
library MetadataBuilder {
    function buildStyles(string memory textColor) internal pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "<style>",
                    ".small { font: italic 13px sans-serif; fill: white; }",
                    ".heavy { font: bold 30px sans-serif; fill: white; }",
                    ".Rrrrr { font: italic 40px serif; fill: ",
                    textColor,
                    "; }",
                    "</style>"
                )
            );
    }

    function generateSVG(
        string memory noun,
        string memory adjective,
        string memory textColor,
        string memory backgroundColor
    ) internal pure returns (string memory) {
        string memory svg = string(
            abi.encodePacked(
                /* solhint-disable */
                '<svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">',
                buildStyles(textColor),
                '<rect x="0" y="0" width="320" height="320" fill="',
                backgroundColor,
                '"/>',
                '<text x="60" y="150" class="small">My</text>',
                '<text x="80" y="150" class="heavy">',
                noun,
                "</text>",
                '<text x="95" y="180" class="small">is</text>',
                '<text x="105" y="180" class="Rrrrr">',
                adjective,
                "!</text>",
                "</svg>"
                /* solhint-enable */
            )
        );

        return svg;
    }

    function tokenURI(
        string memory noun,
        string memory adjective,
        string memory textColor,
        string memory backgroundColor
    ) internal pure returns (string memory) {
        string memory name = string(abi.encodePacked("A ", adjective, " ", noun));
        string memory description = "Tally NFT Workshop";
        string memory image = Base64.encode(bytes(generateSVG(noun, adjective, textColor, backgroundColor)));

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                /* solhint-disable */
                                '{"name":"',
                                name,
                                '", "description":"',
                                description,
                                '", "attributes": [{"trait_type": "noun", "value": ',
                                noun,
                                '"}, {"trait_type": "adjective", "value": ',
                                adjective,
                                '"}], "image": "',
                                "data:image/svg+xml;base64,",
                                image,
                                '"}'
                                /* solhint-enable */
                            )
                        )
                    )
                )
            );
    }
}
